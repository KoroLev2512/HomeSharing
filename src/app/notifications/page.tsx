import React from 'react';
import type { Metadata } from 'next';
import { NotificationsBoard } from '@/layouts/Notifications/NotificationsBoard';

export const metadata: Metadata = {
    title: 'Уведомления — HomeSharing',
    description: 'События по заявкам, объявлениям и избранному.',
};

export default function NotificationsPage() {
    return <NotificationsBoard />;
}
