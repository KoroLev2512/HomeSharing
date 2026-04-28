import React from 'react';
import type { Metadata } from 'next';
import { ListingsBoard } from '@/layouts/Listings/ListingsBoard';

export const metadata: Metadata = {
    title: 'Объявления — HomeSharing',
    description: 'Аренда и покупка квартир без регистрации.',
};

export default function HomePage() {
    return <ListingsBoard />;
}
