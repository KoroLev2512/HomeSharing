import type { Metadata } from 'next';
import { HostVerifyPage } from '@/layouts/Host/HostVerifyPage';

export const metadata: Metadata = { title: 'Верификация права собственности | HomeSharing' };

export default function Page({ params }: { params: { id: string } }) {
    return <HostVerifyPage listingId={params.id} />;
}
