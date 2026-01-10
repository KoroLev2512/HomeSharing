export interface UserDetails {
    id?: string;
    sub?: string;
    email_verified?: boolean;
    allowed_origins?: string[];
    roles?: string[] | null;
    issuer?: string;
    preferred_username?: string;
    given_name: string;
    family_name: string;
    sid?: string;
    acr?: string;
    azp?: string;
    scope?: string;
    email: string;
    hasAvatar?: boolean;
    boxes?: IBoxCard[];
    body?: {
        link: string;
    };
}

export interface ITag {
    name: string;
    text: string;
}

export interface IBoxCard {
    id: number;
    name: string;
    address: string;
    img: string;
    mac_address: string;
    tagConnect?: ITag;
    battery?: number;
    opened?: boolean;
}

export const tags: Record<string, ITag> = {
    green: {name: 'green-tag', text: 'Отличное соединение'},
    yellow: {name: 'yellow-tag', text: 'Хорошее соединение'},
    red: {name: 'red-tag', text: 'Слабое соединение'},
    none: {name: 'none-tag', text: 'Нет соединения'},
}
