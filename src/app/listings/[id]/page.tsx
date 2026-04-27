import React from 'react';
import type { Metadata } from 'next';
import { ListingDetail } from '@/layouts/Listings/ListingDetail';

export const metadata: Metadata = {
    title: 'Объявление — HomeSharing',
};

export default async function ListingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <ListingDetail id={id} />;
}
