import type { Metadata } from 'next';
import { AdminListingsBoard } from '@/layouts/Admin/AdminListingsBoard';

export const metadata: Metadata = { title: 'Объявления — Админ' };

export default function AdminListingsPage() {
    return <AdminListingsBoard />;
}
