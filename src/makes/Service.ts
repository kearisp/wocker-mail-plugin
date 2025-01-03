import {Config, ConfigProperties} from "@wocker/core";

import {MAILDEV_TYPE, MAILHOG_TYPE} from "../env";


export type ServiceType = typeof MAILDEV_TYPE | typeof MAILHOG_TYPE;

export type ServiceProps = ConfigProperties & {
    type: ServiceType;
};

export class Service extends Config<ServiceProps> {
    public type: ServiceType;

    public constructor(props: ServiceProps) {
        const {
            type
        } = props;

        super(props);

        this.type = type;
    }

    public get containerName(): string {
        return `mail-${this.name}.ws`;
    }
}
