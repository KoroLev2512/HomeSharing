import { StaticImageData } from 'next/image';
import room1 from '../../../public/rooms/room1.jpg';
import room2 from '../../../public/rooms/room2.jpg';
import room3 from '../../../public/rooms/room3.jpg';
import room4 from '../../../public/rooms/room4.jpg';
import room5 from '../../../public/rooms/room5.jpg';
import room6 from '../../../public/rooms/room6.png';
import room7 from '../../../public/rooms/room7.jpg';
import room8 from '../../../public/rooms/room8.jpg';
import room9 from '../../../public/rooms/room9.jpg';
import room10 from '../../../public/rooms/room10.jpg';
import room11 from '../../../public/rooms/room11.jpg';
import room12 from '../../../public/rooms/room12.jpg';
import room13 from '../../../public/rooms/room13.jpg';
import room14 from '../../../public/rooms/room14.jpg';
import room15 from '../../../public/rooms/room15.jpg';
import room16 from '../../../public/rooms/room16.jpg';

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
        icon: '/users/user_1.png'
    },
    {
        id: 2,
        name: 'Александр Сидоров',
        role: 'Пользователь',
        icon: '/users/user_2.png'
    },
]

export interface IFlatCard {
    id: number;
    address: string;
    img: StaticImageData;
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
        address: 'Санкт-Петербург, набережная Макарова, 60',
        dateRange: '20 май. 2024 – 1 июнь. 2024',
        dateStart: '20.05.2024',
        dateEnd: '1.06.2024',
        tagFlat: tags.gray,
        tagLock: tags.yellow,
        isDisabled: true,
        wifiLogin: 'LUX_APPARTS_12',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room1,
    },
    {
        id: 2,
        address: `Санкт-Петербург, улица Чайковского, 26`,
        dateRange: '12 июнь. 2024 – 17 июнь. 2024',
        dateStart: '12.06.2024',
        dateEnd: '27.06.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room6,
    },
    {
        id: 3,
        address: 'Санкт-Петербург, Днепропетровская улица, 3',
        dateRange: '6 июнь. 2024 – 12 июнь. 2024',
        dateStart: '6.08.2024',
        dateEnd: '12.08.2024',
        tagFlat: tags.lilac,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room2,
    },
    {
        id: 4,
        address: 'Санкт-Петербург, Загородный проспект, 24',
        dateRange: '4 июнь. 2024 – 5 июнь. 2024',
        dateStart: '4.06.2024',
        dateEnd: '5.06.2024',
        tagFlat: tags.orange,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room3,
    },
    {
        id: 5,
        address: `Санкт-Петербург, Гончарная улица, 9`,
        dateRange: '5 июнь. 2024 – 7 июнь. 2024',
        dateStart: '5.06.2024',
        dateEnd: '7.06.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room4,
    },
    {
        id: 6,
        address: `Санкт-Петербург, 26-я Васильевского острова линия, 7`,
        dateRange: '8 июнь. 2024 – 10 июнь. 2024',
        dateStart: '8.06.2024',
        dateEnd: '10.06.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room5,
    },
    {
        id: 7,
        address: `Санкт-Петербург, улица Рубинштейна, 28`,
        dateRange: '12 июнь. 2024 – 20 июль. 2024',
        dateStart: '12.06.2024',
        dateEnd: '20.06.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room7,
    },
    {
        id: 8,
        address: `Санкт-Петербург, улица Салова, 61`,
        dateRange: '14 июнь. 2024 – 30 июнь. 2024',
        dateStart: '12.06.2024',
        dateEnd: '30.06.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room8,
    },
    {
        id: 9,
        address: `Санкт-Петербург, Лиговский проспект, 44В`,
        dateRange: '15 июнб. 2024 – 28 июнь. 2024',
        dateStart: '15.06.2024',
        dateEnd: '15.06.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room9,
    },
    {
        id: 10,
        address: `Санкт-Петербург, Лиговский переулок, 65`,
        dateRange: '15 июнь. 2024 – 30 июнь. 2024',
        dateStart: '15.06.2024',
        dateEnd: '30.06.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room10,
    },
    {
        id: 11,
        address: `Санкт-Петербург, набережная Реки Фонтанки, 137`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room11,
    },
    {
        id: 12,
        address: `Санкт-Петербург, улица Моисеенко, 5`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room12,
    },
    {
        id: 13,
        address: `Санкт-Петербург, 5-я Советская улица, 10`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room13,
    },
    {
        id: 14,
        address: `Санкт-Петербург, проезд Толубеевский, 8к2`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room14,
    },
    {
        id: 15,
        address: `Санкт-Петербург, 7-я Советская улица, 40`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room15,
    },
    {
        id: 16,
        address: `Санкт-Петербург, Большой Сампсониевский проспект, 69к5`,
        dateRange: '29 апр. 2024 – 30 апр. 2024',
        dateStart: '29.04.2024',
        dateEnd: '30.04.2024',
        tagFlat: tags.green,
        tagLock: tags.yellow,
        isDisabled: false,
        wifiLogin: 'Super Wi-Fi Network',
        wifiPass: 'Nf,ehtnrf31',
        persons: testPersons,
        img: room16,
    },

]