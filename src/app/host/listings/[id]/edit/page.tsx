import React from 'react';
import type { Metadata } from 'next';
import { HostListingFormPage } from '@/layouts/Host/HostListingFormPage';

export const metadata: Metadata = {
    title: 'Редактирование объявления — HomeSharing',
};

interface IProps {
    params: Promise<{ id: string }>;
}

export default async function HostListingEditPage({ params }: IProps) {
    const { id } = await params;
    return <HostListingFormPage mode="edit" listingId={id} />;
}
