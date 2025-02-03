import {Config, ConfigProperties} from "@wocker/core";

import {MAILDEV_TYPE, MAILHOG_TYPE} from "../env";


export type ServiceType = typeof MAILDEV_TYPE | typeof MAILHOG_TYPE;

export type ServiceProps = ConfigProperties & {
    type: ServiceType;
    image?: string;
    imageName?: string;
    imageVersion?: string;
};

export class Service extends Config<ServiceProps> {
    public type: ServiceType;
    public imageName?: string;
    public imageVersion?: string;

    public constructor(props: ServiceProps) {
        const {
            type,
            image,
            imageName = image,
            imageVersion
        } = props;

        super(props);

        this.type = type;
        this.imageName = imageName;
        this.imageVersion = imageVersion;
    }

    public get containerName(): string {
        return `mail-${this.name}.ws`;
    }

    public get imageTag(): string {
        let imageName = this.imageName,
            imageVersion = this.imageVersion;

        if(!imageName) {
            switch(this.type) {
                case MAILDEV_TYPE:
                    imageName = "maildev/maildev";
                    break;

                case MAILHOG_TYPE:
                    imageName = "mailhog/mailhog";
                    break;
            }
        }

        if(!imageVersion) {
            imageVersion = "latest";
        }

        return `${imageName}:${imageVersion}`;
    }
}
