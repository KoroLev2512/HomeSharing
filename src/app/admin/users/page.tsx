import type { Metadata } from 'next';
import { AdminUsersBoard } from '@/layouts/Admin/AdminUsersBoard';

export const metadata: Metadata = { title: 'Пользователи — Админ' };

export default function AdminUsersPage() {
    return <AdminUsersBoard />;
}
