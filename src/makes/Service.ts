import {MAILDEV_TYPE, MAILHOG_TYPE} from "../env";


export type ServiceType = typeof MAILDEV_TYPE | typeof MAILHOG_TYPE;

export type ServiceProps = {
    name: string;
    type: ServiceType;
    image?: string;
    imageName?: string;
    imageVersion?: string;
};

export class Service {
    public name: string;
    public type: ServiceType;
    public imageName?: string;
    public imageVersion?: string;

    public constructor(props: ServiceProps) {
        const {
            name,
            type,
            image,
            imageName = image,
            imageVersion
        } = props;

        this.name = name;
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
            return imageName;
        }

        return `${imageName}:${imageVersion}`;
    }

    public toObject(): ServiceProps {
        return {
            name: this.name,
            type: this.type,
            imageName: this.imageName,
            imageVersion: this.imageVersion
        };
    }
}
