import type { Metadata } from 'next';
import { GuestAccessPage } from '@/layouts/Bookings/GuestAccessPage';

export const metadata: Metadata = { title: 'Цифровой доступ | HomeSharing' };

export default function Page({ params }: { params: { id: string } }) {
    return <GuestAccessPage bookingId={params.id} />;
}
