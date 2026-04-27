import React from 'react';
import type { Metadata } from 'next';
import { FavoritesBoard } from '@/layouts/Favorites/FavoritesBoard';

export const metadata: Metadata = {
    title: 'Избранное — HomeSharing',
    description: 'Сохранённые объявления.',
};

export default function FavoritesPage() {
    return <FavoritesBoard />;
}
