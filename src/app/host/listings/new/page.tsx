import React from 'react';
import type { Metadata } from 'next';
import { HostListingFormPage } from '@/layouts/Host/HostListingFormPage';

export const metadata: Metadata = {
    title: 'Новое объявление — HomeSharing',
};

export default function HostListingNewPage() {
    return <HostListingFormPage mode="create" />;
}
