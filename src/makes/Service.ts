import {ProviderType, ProviderTypeEnum} from "../types";


export type ServiceProps = {
    name: string;
    type: ProviderType;
    image?: string;
    imageName?: string;
    imageVersion?: string;
};

export class Service {
    public name: string;
    public type: ProviderType;
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
                case ProviderTypeEnum.MAILDEV:
                    imageName = "maildev/maildev";
                    break;

                case ProviderTypeEnum.MAILHOG:
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
