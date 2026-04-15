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
        return Object.values(ProviderTypeEnum).map(() => {

        })
    }
});
