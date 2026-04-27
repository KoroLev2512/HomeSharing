import { redirect } from 'next/navigation';

export default function HostHomePage() {
    redirect('/host/listings');
}
