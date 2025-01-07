import {Config, ConfigProperties} from "@wocker/core";

import {MAILDEV_TYPE, MAILHOG_TYPE} from "../env";


export type ServiceType = typeof MAILDEV_TYPE | typeof MAILHOG_TYPE;

export type ServiceProps = ConfigProperties & {
    type: ServiceType;
    image?: string;
    imageVersion?: string;
};

export class Service extends Config<ServiceProps> {
    public type: ServiceType;
    public image?: string;
    public imageVersion?: string;

    public constructor(props: ServiceProps) {
        const {
            type,
            image,
            imageVersion
        } = props;

        super(props);

        this.type = type;
        this.image = image;
        this.imageVersion = imageVersion;
    }

    public get containerName(): string {
        return `mail-${this.name}.ws`;
    }

    public get imageName(): string {
        let image = this.image,
            imageVersion = this.imageVersion;

        if(!image) {
            switch(this.type) {
                case MAILDEV_TYPE:
                    image = "maildev/maildev";
                    break;

                case MAILHOG_TYPE:
                    image = "mailhog/mailhog";
                    break;
            }
        }

        if(!imageVersion) {
            imageVersion = "latest";
        }

        return `${image}:${imageVersion}`;
    }
}
