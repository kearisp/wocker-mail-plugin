import {
    ConfigCollection
} from "@wocker/core";

import {Service, ServiceProps} from "./Service";


export type ConfigProps = {
    default?: string;
    services?: ServiceProps[];
};

export abstract class Config {
    public default?: string;
    public services: Service[];

    public constructor(props: ConfigProps) {
        const {
            default: defaultService,
            services = []
        } = props;

        this.default = defaultService;
        this.services = services.map((serviceProps) => {
            return new Service(serviceProps);
        });
    }

    public getService(name: string): Service {
        const service = this.services.find((service) => {
            return service.name === name;
        });

        if(!service) {
            throw new Error(`Service "${name}" not found`);
        }

        return service;
    }

    public getServiceOrDefault(name?: string): Service {
        if(name) {
            return this.getService(name);
        }

        if(!this.default) {
            throw new Error("No services are installed by default");
        }

        return this.getService(this.default);
    }

    public setService(service: Service): void {
        let exists = false;

        for(let i = 0; i < this.services.length; i++) {
            if(this.services[i].name === service.name) {
                exists = true;
                this.services[i] = service;
            }
        }

        if(!exists) {
            this.services.push(service);
        }

        if(!this.default) {
            this.default = service.name;
        }
    }

    public unsetService(name: string): void {
        this.services = this.services.filter((service) => {
            return service.name !== name;
        });

        if(this.default === name) {
            delete this.default;
        }
    }

    public hasService(name: string): boolean {
        return !!this.services.find((service) => {
            return service.name === name;
        });
    }

    public abstract save(): void;

    public toObject(): ConfigProps {
        return {
            default: this.default,
            services: this.services.map((service) => {
                return service.toObject();
            })
        };
    }
}
