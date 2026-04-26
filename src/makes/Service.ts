import {Image} from "@wocker/utils";
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
    protected _image?: string;
    public imageName?: string;
    public imageVersion?: string;

    public constructor(props: ServiceProps) {
        const {
            name,
            type,
            imageName,
            imageVersion,
            image
        } = props;

        this.name = name;
        this.type = type;
        this._image = image || (imageName && imageVersion ? `${imageName}:${imageVersion}` : imageName);
    }

    public get containerName(): string {
        return `mail-${this.name}.ws`;
    }

    public get imageTag(): string {
        let image = this._image

        if(!image) {
            switch(this.type) {
                case ProviderTypeEnum.MAILDEV:
                    image = "maildev/maildev";
                    break;

                case ProviderTypeEnum.MAILHOG:
                    image = "mailhog/mailhog";
                    break;
            }
        }

        return image;
    }

    public set image(image: undefined | string) {
        if(typeof image === "undefined") {
            delete this._image;
            return;
        }

        if(Image.isValid(image)) {
            throw new Error(`Invalid image ${image}`);
        }

        this._image = image;
    }

    public toObject(): ServiceProps {
        return {
            name: this.name,
            type: this.type,
            image: this._image
        };
    }
}
