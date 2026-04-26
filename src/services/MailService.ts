import {Injectable, PluginConfigService, DockerService, ProxyService} from "@wocker/core";
import {promptInput, promptSelect, promptConfirm} from "@wocker/utils";
import CliTable from "cli-table3";
import {Config} from "../makes/Config";
import {Service} from "../makes/Service";
import {ProviderType} from "../types";


@Injectable()
export class MailService {
    protected _config?: Config;

    public constructor(
        protected readonly pluginConfigService: PluginConfigService,
        protected readonly dockerService: DockerService,
        protected readonly proxyService: ProxyService
    ) {}

    public get config(): Config {
        if(!this._config) {
            this._config = Config.make(this.pluginConfigService.fs);
        }

        return this._config;
    }

    public async list(): Promise<string> {
        const cliTable = new CliTable({
            head: ["Name", "Type", "Container", "Image"]
        });

        for(const service of this.config.services) {
            cliTable.push([
                service.name + (this.config.default === service.name ? " (default)" : ""),
                service.type,
                service.containerName,
                service.imageTag
            ]);
        }

        return cliTable.toString();
    }

    public async create(name?: string, type?: ProviderType, image?: string): Promise<void> {
        if(!name || this.config.hasService(name)) {
            name = await promptInput({
                message: "Service name",
                required: "Service name is required",
                validate: (value?: string) => {
                    if(value && this.config.hasService(value)) {
                        return "Service already exists";
                    }

                    return true;
                }
            }) as string;
        }

        if(!type || !ProviderType.values().includes(type)) {
            type = await promptSelect<ProviderType>({
                message: "Provider",
                options: ProviderType.options()
            });
        }

        const service = new Service({
            name,
            type,
            image
        });

        this.config.setService(service);
        this.config.save();
    }

    public async upgrade(name?: string, type?: ProviderType, image?: string): Promise<void> {
        const service = this.config.getServiceOrDefault(name);

        let changed = false;

        if(type) {
            if(!ProviderType.values().includes(type)) {
                throw new Error("Invalid service type");
            }

            if(service.type !== type) {
                delete service.image;
            }

            service.type = type;
            changed = true;
        }

        if(image) {
            service.image = image;
            changed = true;
        }

        if(changed) {
            this.config.setService(service);
            this.config.save();
        }
    }

    public async destroy(name: string, force?: boolean, yes?: boolean): Promise<void> {
        const service = this.config.getService(name);

        if(!force && service.name === this.config.default) {
            throw new Error("Can't destroy default service");
        }

        if(!yes) {
            const confirm = await promptConfirm({
                message: `Are you sure you want to delete the "${name}" service? This action cannot be undone and all data will be lost.`,
                default: false
            });

            if(!confirm) {
                throw new Error("Aborted");
            }
        }

        await this.dockerService.removeContainer(service.containerName);

        this.config.unsetService(name);
        this.config.save();
    }

    public async start(name?: string, restart?: boolean): Promise<void> {
        if(!name && !this.config.default) {
            await this.create();
        }

        const service = this.config.getServiceOrDefault(name);

        let container = await this.dockerService.getContainer(service.containerName);

        if(container && restart) {
            await this.dockerService.removeContainer(service.containerName);
            container = null;
        }

        if(!container) {
            switch(service.type) {
                case ProviderType.MAILDEV: {
                    container = await this.dockerService.createContainer({
                        name: service.containerName,
                        image: service.imageTag,
                        restart: "always",
                        env: {
                            VIRTUAL_HOST: service.containerName,
                            VIRTUAL_PORT: "80",
                            MAILDEV_WEB_PORT: "80",
                            MAILDEV_SMTP_PORT: "25"
                        }
                    });
                    break;
                }

                case ProviderType.MAILHOG:
                    container = await this.dockerService.createContainer({
                        name: service.containerName,
                        image: service.imageTag,
                        restart: "always",
                        env: {
                            VIRTUAL_HOST: service.containerName,
                            VIRTUAL_PORT: "8025"
                        }
                    });
                    break;

                default:
                    throw new Error(`Unsupported service type`);
            }
        }

        const {
            State: {
                Running
            }
        } = await container.inspect();

        await this.proxyService.start();

        if(Running) {
            console.info(`Service "${service.name}" is already running at http://${service.containerName}`);
            return;
        }

        await container.start();

        console.info(`Service "${service.name}" started at http://${service.containerName}`);
    }

    public async stop(name?: string): Promise<void> {
        const service = this.config.getServiceOrDefault(name);

        await this.dockerService.removeContainer(service.containerName);
    }

    public use(name?: string): string|void {
        if(!name) {
            const service = this.config.getServiceOrDefault();

            return service.name;
        }

        const service = this.config.getService(name);

        this.config.default = service.name;
        this.config.save();
    }
}
