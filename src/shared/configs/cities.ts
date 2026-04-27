/**
 * Static city catalog used by the listings filter UI.
 * The actual listings live in Supabase; this list defines which cities
 * are presented as choices in the city select.
 */
export const cityCatalog: ReadonlyArray<{
    city: string;
    districts: string[];
    metros: string[];
}> = [
    {
        city: 'Санкт-Петербург',
        districts: [
            'Центральный',
            'Адмиралтейский',
            'Василеостровский',
            'Петроградский',
            'Выборгский',
            'Калининский',
            'Фрунзенский',
            'Невский',
        ],
        metros: [
            'Невский проспект',
            'Гостиный двор',
            'Чернышевская',
            'Площадь Восстания',
            'Спортивная',
            'Технологический институт',
            'Звенигородская',
            'Лиговский проспект',
            'Сенная площадь',
            'Василеостровская',
        ],
    },
    {
        city: 'Москва',
        districts: ['Тверской', 'Пресненский', 'Хамовники', 'Замоскворечье', 'Басманный'],
        metros: ['Тверская', 'Пушкинская', 'Чеховская', 'Маяковская', 'Курская', 'Парк культуры'],
    },
];

export const mockCities: string[] = Array.from(new Set(cityCatalog.map((c) => c.city)));
