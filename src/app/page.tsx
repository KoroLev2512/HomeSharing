import React from 'react';
import type { Metadata } from 'next';
import { ListingsBoard } from '@/layouts/Listings/ListingsBoard';
import { ListingsRepo } from '@/shared/lib/listingsRepo';
import type { IListingsResponse } from '@/shared/types/listing';

export const metadata: Metadata = {
    title: 'Объявления — HomeSharing',
    description: 'Аренда и покупка квартир без регистрации.',
};

export default async function HomePage() {
    let initialData: IListingsResponse | undefined;
    try {
        initialData = await ListingsRepo.list({ sort: 'new', page: 1, perPage: 12 });
    } catch {
        // Если БД недоступна — клиент загрузит данные сам
    }

    return <ListingsBoard initialData={initialData} />;
}
