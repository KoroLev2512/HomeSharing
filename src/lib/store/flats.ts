export interface ITag {
    name: string;
    text: string;
}


interface IPerson {
    id: number;
    name: string;
    role: string;
    icon: string;
}

export const testPersons: IPerson[] = [
    {
        id: 1,
        name: 'Мария Петрова',
        role: 'Пользователь',
        icon: 'ICON'
    },
    {
        id: 2,
        name: 'Александр Сидоров',
        role: 'Пользователь',
        icon: 'ICON'
    },
    {
        id: 3,
        name: 'Мария Сидоров',
        role: 'Пользователь',
        icon: 'ICON'
    },
    {
        id: 4,
        name: 'Александр Петрова',
        role: 'Пользователь',
        icon: 'ICON'
    }
]

export interface IFlatCard {
    id: number;
    address: string;
    dateRange: string;
    dateStart: string;
    dateEnd: string;
    tagFlat?: ITag;
    tagLock?: ITag;
    isDisabled?: boolean;
    wifiLogin: string;
    wifiPass: string;
    persons: IPerson[];
}

const tags: Record<string, ITag> = {
    lilac: {name: 'lilac-tag', text: 'Квартира занята'},
    orange: {name: 'orange-tag', text: 'Требуется уборка'},
    gray: {name: 'gray-tag', text: 'Доступ истек'},
    green: {name: 'green-tag', text: 'Не требуется'},
    yellow: {name: 'yellow-tag', text: 'Закрыт'},
}

export const flats: IFlatCard[] = [
    {
        id: 1,
        address: 'Санкт-Петербург, ул. Ломоносова 9',
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.gray,
        tagLock: tags.yellow,
        isDisabled: true,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 2,
        address: 'Санкт-Петербург, ул. Ломоносова 10',
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.lilac,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 3,
        address: 'Санкт-Петербург, ул. Ломоносова 11',
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.orange,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 4,
        address: `Санкт-Петербург, ул. Ломоносова 12`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 5,
        address: `Санкт-Петербург, ул. Ломоносова 13`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 6,
        address: `Санкт-Петербург, ул. Ломоносова 14`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },
    {
        id: 7,
        address: `Санкт-Петербург, ул. Ломоносова 15`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons
    },

]