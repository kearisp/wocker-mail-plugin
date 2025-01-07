import {Injectable, PluginConfigService, DockerService} from "@wocker/core";
import {promptSelect, promptText, promptConfirm} from "@wocker/utils";
import CliTable from "cli-table3";
import {MAILDEV_TYPE, MAILHOG_TYPE} from "../env";

import {Config, ConfigProps} from "../makes/Config";
import {Service, ServiceType} from "../makes/Service";


@Injectable()
export class MailService {
    protected _config?: Config;

    public constructor(
        protected readonly pluginConfigService: PluginConfigService,
        protected readonly dockerService: DockerService
    ) {}

    public get config(): Config {
        if(!this._config) {
            const fs = this.pluginConfigService.fs,
                data: ConfigProps = fs.exists("config.json")
                    ? fs.readJSON("config.json")
                    : {}

            this._config = new class extends Config {
                public save(): void {
                    if(!fs.exists("")) {
                        fs.mkdir("", {
                            recursive: true
                        });
                    }

                    fs.writeJSON("config.json", this.toObject());
                }
            }(data);
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
                service.imageName
            ]);
        }

        return cliTable.toString();
    }

    public async create(name?: string, type?: ServiceType, image?: string, imageVersion?: string): Promise<void> {
        if(!name || this.config.hasService(name)) {
            name = await promptText({
                message: "Service name:",
                validate: (value?: string) => {
                    if(!value) {
                        return "Service name is required";
                    }

                    if(this.config.hasService(value)) {
                        return "Service already exists";
                    }

                    return true;
                }
            }) as string;
        }

        if(!type || ![MAILDEV_TYPE, MAILHOG_TYPE].includes(type)) {
            type = await promptSelect<ServiceType>({
                options: [MAILDEV_TYPE, MAILHOG_TYPE]
            });
        }

        const service = new Service({
            name,
            type,
            image,
            imageVersion
        });

        this.config.setService(service);
        this.config.save();
    }

    public async upgrade(name?: string, type?: ServiceType, image?: string, imageVersion?: string): Promise<void> {
        const service = this.config.getServiceOrDefault(name);

        let changed = false;

        if(type) {
            if(![MAILDEV_TYPE, MAILHOG_TYPE].includes(type)) {
                throw new Error("Invalid service type");
            }

            if(service.type !== type) {
                delete service.image;
                delete service.imageVersion;
            }

            service.type = type;
            changed = true;
        }

        if(image) {
            service.image = image;
            changed = true;
        }

        if(imageVersion) {
            service.imageVersion = imageVersion;
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
            container = null
        }

        if(!container) {
            switch(service.type) {
                case MAILDEV_TYPE: {
                    container = await this.dockerService.createContainer({
                        name: service.containerName,
                        image: service.imageName,
                        restart: "always",
                        env: {
                            VIRTUAL_HOST: service.containerName,
                            VIRTUAL_PORT: "80"
                        }
                    });
                    break;
                }

                case MAILHOG_TYPE:
                    container = await this.dockerService.createContainer({
                        name: service.containerName,
                        image: service.imageName,
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

        if(!Running) {
            await container.start();

            console.info(`Started at ${service.containerName}`);
        }
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
