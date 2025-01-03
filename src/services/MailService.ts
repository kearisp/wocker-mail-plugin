import {Injectable, PluginConfigService, DockerService} from "@wocker/core";
import {promptSelect, promptText} from "@wocker/utils";
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
            head: ["Name", "Type", "Container"]
        });

        for(const service of this.config.services) {
            cliTable.push([
                service.name + (this.config.default === service.name ? " (default)" : ""),
                service.type,
                service.containerName
            ]);
        }

        return cliTable.toString();
    }

    public async create(name?: string, type?: ServiceType): Promise<void> {
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
            type
        });

        this.config.setService(service);
        this.config.save();
    }

    public async upgrade(name?: string, type?: ServiceType): Promise<void> {
        const service = this.config.getServiceOrDefault(name);

        let changed = false;

        if(type) {
            if(![MAILDEV_TYPE, MAILHOG_TYPE].includes(type)) {
                throw new Error("Invalid service type");
            }

            service.type = type;
            changed = true;
        }

        if(changed) {
            this.config.setService(service);
            this.config.save();
        }
    }

    public async destroy(name: string): Promise<void> {
        const service = this.config.getService(name);

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
                        image: "djfarrelly/maildev",
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
                        image: "mailhog/mailhog",
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
}
