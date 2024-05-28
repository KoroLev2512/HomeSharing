export interface ITag {
    name: string;
    text: string;
}

export interface IFlatCard {
    id: number;
    address: string;
    date: string;
    tag?: ITag;
    isDisabled?: boolean;
}

const tags: Record<string, ITag> = {
    lilac: {name: 'lilac-tag', text: 'Квартира занята'},
    orange: {name: 'orange-tag', text: 'Требуется уборка'},
    gray: {name: 'gray-tag', text: 'Доступ истек'},
    green: {name: 'green-tag', text: 'Не требуется'}
}

export const flats:IFlatCard[] = [
    {
        id: 1,
        address: 'Санкт-Петербург, ул. Ломоносова 9',
        date: '29 апр. 2024 – 30 апр. 2024',
        tag: tags.gray,
        isDisabled: true
    },
    {
        id: 2,
        address: 'Санкт-Петербург, ул. Ломоносова 10',
        date: '29 апр. 2024 – 30 апр. 2024',
        tag: tags.lilac
    },
    {
        id: 3,
        address: 'Санкт-Петербург, ул. Ломоносова 11',
        date: '29 апр. 2024 – 30 апр. 2024',
        tag: tags.orange
    },
    {
        id: 4,
        address: 'Санкт-Петербург, ул. Ломоносова 12',
        date: '29 апр. 2024 – 30 апр. 2024',
        tag: tags.green
    },
    {
        id: 5,
        address: 'Санкт-Петербург, ул. Ломоносова 12',
        date: '29 апр. 2024 – 30 апр. 2024',
        tag: tags.green
    },
    {
        id: 6,
        address: 'Санкт-Петербург, ул. Ломоносова 12',
        date: '29 апр. 2024 – 30 апр. 2024',
        tag: tags.green
    },
    {
        id: 7,
        address: 'Санкт-Петербург, ул. Ломоносова 12',
        date: '29 апр. 2024 – 30 апр. 2024',
        tag: tags.green
    },
]