export enum ProviderTypeEnum {
    MAILDEV = "maildev",
    MAILHOG = "mailhog"
}

export type ProviderType = ProviderTypeEnum;

export const ProviderType = Object.assign({}, ProviderTypeEnum, {
    values: () => {
        return Object.values(ProviderTypeEnum);
    },
    options: () => {
        return ProviderType.values().map((type) => {
            return {
                label: ProviderType.label(type),
                value: type
            };
        });
    },
    label: (type: ProviderTypeEnum): string => {
        switch(type) {
            case ProviderTypeEnum.MAILDEV:
                return "MailDev";

            case ProviderTypeEnum.MAILHOG:
                return "MailHog";

            default:
                throw new Error(`Unsupported type: "${type}"`);
        }
    }
});
