import React from 'react';
import type { Metadata } from 'next';
import { HostBookingsBoard } from '@/layouts/Host/HostBookingsBoard';

export const metadata: Metadata = {
    title: 'Бронирования — HomeSharing',
};

export default function HostBookingsPage() {
    return <HostBookingsBoard />;
}
