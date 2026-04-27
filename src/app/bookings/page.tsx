import React from 'react';
import type { Metadata } from 'next';
import { BookingsBoard } from '@/layouts/Bookings/BookingsBoard';

export const metadata: Metadata = {
    title: 'Мои бронирования — HomeSharing',
    description: 'Список ваших бронирований и их статусов.',
};

export default function BookingsPage() {
    return <BookingsBoard />;
}
