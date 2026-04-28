// Seeds public.listings from the same generator used by src/shared/store/mockListings.ts.
// Run: node --env-file=.env.local scripts/seed-listings.mjs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const owners = [
    { name: 'Юрий Королев', avatar: '/users/user_1.webp', type: 'owner', phoneMasked: '+7 (911) ••• ••-23' },
    { name: 'Мария Петрова', avatar: '/users/user_2.png', type: 'owner', phoneMasked: '+7 (921) ••• ••-58' },
    { name: 'Александр Сидоров', avatar: '/users/user_1.webp', type: 'owner', phoneMasked: '+7 (931) ••• ••-04' },
    { name: 'Этажи', avatar: '/users/user_2.png', type: 'agency', phoneMasked: '+7 (812) ••• ••-12' },
    { name: 'Самолет Плюс', avatar: '/users/user_1.webp', type: 'agency', phoneMasked: '+7 (812) ••• ••-77' },
];

const baseAmenities = ['Wi-Fi', 'Стиральная машина', 'Холодильник', 'Кондиционер', 'Балкон'];

const seedAddresses = [
    { city: 'Санкт-Петербург', address: 'набережная Макарова, 60', district: 'Василеостровский', metro: 'Спортивная', metroMin: 8 },
    { city: 'Санкт-Петербург', address: 'улица Чайковского, 26', district: 'Центральный', metro: 'Чернышевская', metroMin: 5 },
    { city: 'Санкт-Петербург', address: 'Днепропетровская улица, 3', district: 'Центральный', metro: 'Лиговский проспект', metroMin: 6 },
    { city: 'Санкт-Петербург', address: 'Загородный проспект, 24', district: 'Центральный', metro: 'Звенигородская', metroMin: 4 },
    { city: 'Санкт-Петербург', address: 'Гончарная улица, 9', district: 'Центральный', metro: 'Площадь Восстания', metroMin: 3 },
    { city: 'Санкт-Петербург', address: '26-я линия Васильевского острова, 7', district: 'Василеостровский', metro: 'Василеостровская', metroMin: 12 },
    { city: 'Санкт-Петербург', address: 'улица Рубинштейна, 28', district: 'Центральный', metro: 'Достоевская', metroMin: 5 },
    { city: 'Санкт-Петербург', address: 'улица Салова, 61', district: 'Фрунзенский', metro: 'Бухарестская', metroMin: 14 },
    { city: 'Санкт-Петербург', address: 'Лиговский проспект, 44В', district: 'Центральный', metro: 'Лиговский проспект', metroMin: 2 },
    { city: 'Санкт-Петербург', address: 'Лиговский переулок, 65', district: 'Центральный', metro: 'Площадь Восстания', metroMin: 7 },
    { city: 'Санкт-Петербург', address: 'набережная реки Фонтанки, 137', district: 'Адмиралтейский', metro: 'Технологический институт', metroMin: 9 },
    { city: 'Санкт-Петербург', address: 'улица Моисеенко, 5', district: 'Центральный', metro: 'Площадь Александра Невского', metroMin: 8 },
    { city: 'Санкт-Петербург', address: '5-я Советская улица, 10', district: 'Центральный', metro: 'Площадь Восстания', metroMin: 11 },
    { city: 'Санкт-Петербург', address: 'Толубеевский проезд, 8к2', district: 'Фрунзенский', metro: 'Купчино', metroMin: 6 },
    { city: 'Санкт-Петербург', address: '7-я Советская улица, 40', district: 'Центральный', metro: 'Площадь Восстания', metroMin: 12 },
    { city: 'Санкт-Петербург', address: 'Большой Сампсониевский проспект, 69к5', district: 'Выборгский', metro: 'Лесная', metroMin: 8 },
    { city: 'Москва', address: 'Никитский бульвар, 12', district: 'Пресненский', metro: 'Арбатская', metroMin: 5 },
    { city: 'Москва', address: 'улица Поварская, 8', district: 'Пресненский', metro: 'Баррикадная', metroMin: 7 },
    { city: 'Москва', address: 'Покровка, 27', district: 'Басманный', metro: 'Курская', metroMin: 6 },
    { city: 'Москва', address: '1-й Тверской-Ямской переулок, 13', district: 'Тверской', metro: 'Маяковская', metroMin: 4 },
    { city: 'Москва', address: 'Большая Полянка, 30', district: 'Замоскворечье', metro: 'Полянка', metroMin: 3 },
    { city: 'Москва', address: 'Остоженка, 7', district: 'Хамовники', metro: 'Кропоткинская', metroMin: 8 },
];

const roomImages = Array.from({ length: 22 }, (_, i) => {
    const idx = i + 1;
    const ext = idx === 6 ? 'png' : 'jpg';
    return `/rooms/room${idx}.${ext}`;
});

const sample = (arr, seed) => arr[Math.abs(seed) % arr.length];

const buildTitle = (rooms, area) => (rooms === 0 ? `Студия, ${area} м²` : `${rooms}-комн. квартира, ${area} м²`);

const generate = () => {
    const items = [];
    seedAddresses.forEach((seed, idx) => {
        const rooms = idx % 5 === 0 ? 0 : (idx % 4) + 1;
        const area = rooms === 0 ? 22 + (idx % 8) : rooms * 18 + (idx % 12);
        const floor = (idx % 16) + 1;
        const totalFloors = floor + (idx % 6) + 2;
        const dealVariants = idx % 3 === 0 ? ['rent_long', 'sale'] : idx % 3 === 1 ? ['rent_short', 'rent_long'] : ['rent_long'];

        dealVariants.forEach((dealType, vIdx) => {
            const id = `${idx + 1}-${vIdx}`;
            let price;
            if (dealType === 'sale') price = (8_500_000 + idx * 350_000 + rooms * 1_500_000) | 0;
            else if (dealType === 'rent_short') price = 2_800 + ((idx * 350) % 4500);
            else price = 28_000 + ((idx * 1750) % 65_000) + rooms * 8_000;

            const period = dealType === 'sale' ? null : dealType === 'rent_short' ? 'day' : 'month';

            const photos = [0, 1, 2, 3, 4, 5].map((shift) => sample(roomImages, idx * 7 + vIdx * 3 + shift));
            const owner = sample(owners, idx + vIdx);
            const amenities = baseAmenities.slice(0, 3 + ((idx + vIdx) % 3));
            if (idx % 2 === 0) amenities.push('Можно с детьми');
            if (idx % 3 === 0) amenities.push('Можно с животными');
            if (rooms >= 3) amenities.push('Парковка');

            const publishedAt = new Date(Date.now() - (idx * 86400000 + vIdx * 3600000)).toISOString();

            items.push({
                id,
                title: buildTitle(rooms, area),
                deal_type: dealType,
                property_type: rooms === 0 ? 'studio' : 'flat',
                rooms,
                area,
                living_area: Math.max(10, area - 8 - (idx % 5)),
                kitchen_area: 8 + (idx % 6),
                floor,
                total_floors: totalFloors,
                price,
                price_period: period,
                deposit: dealType === 'rent_long' ? Math.round(price) : null,
                city: seed.city,
                district: seed.district ?? null,
                metro: seed.metro ?? null,
                metro_distance_min: seed.metroMin ?? null,
                address: `${seed.city}, ${seed.address}`,
                description:
                    'Светлая, уютная квартира после ремонта. Вся необходимая мебель и техника. Чистый подъезд, тихие соседи. Рядом магазины, кафе, парк, школа и детский сад.',
                amenities,
                images: photos,
                rating: 4.4 + ((idx % 7) / 10),
                reviews_count: 3 + (idx % 18),
                published_at: publishedAt,
                is_verified: idx % 4 === 0,
                owner_name: owner.name,
                owner_avatar: owner.avatar ?? null,
                owner_type: owner.type,
                owner_phone_masked: owner.phoneMasked ?? null,
            });
        });
    });
    return items;
};

const items = generate();
console.log(`Generated ${items.length} listings, upserting…`);

const { error } = await supabase.from('listings').upsert(items, { onConflict: 'id' });
if (error) {
    console.error('Upsert failed:', error);
    process.exit(1);
}

const { count, error: countErr } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });
if (countErr) {
    console.error('Count failed:', countErr);
    process.exit(1);
}
console.log(`Done. Listings in DB: ${count}`);
