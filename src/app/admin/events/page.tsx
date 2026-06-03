import { AdminShell } from '@/layouts/Admin/AdminShell';
import { AdminEventsBoard } from '@/layouts/Admin/AdminEventsBoard';

export const metadata = { title: 'Аудит-журнал | Администрация | HomeSharing' };

export default function AdminEventsPage() {
    return (
        <AdminShell>
            <AdminEventsBoard />
        </AdminShell>
    );
}
