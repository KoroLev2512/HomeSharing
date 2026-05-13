import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Кабинет арендодателя',
    description: 'Управление объявлениями и бронированиями',
};

export default function HostHomePage() {
    redirect('/host/listings');
}
