import React from 'react';
import type { Metadata } from 'next';
import { HostListingsBoard } from '@/layouts/Host/HostListingsBoard';

export const metadata: Metadata = {
    title: 'Мои объявления — HomeSharing',
};

export default function HostListingsPage() {
    return <HostListingsBoard />;
}
