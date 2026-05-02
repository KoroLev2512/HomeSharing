import type { Metadata } from 'next';
import { AdminBookingsBoard } from '@/layouts/Admin/AdminBookingsBoard';

export const metadata: Metadata = { title: 'Бронирования — Админ' };

export default function AdminBookingsPage() {
    return <AdminBookingsBoard />;
}
