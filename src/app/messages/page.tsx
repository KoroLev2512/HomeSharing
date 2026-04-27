import React from 'react';
import type { Metadata } from 'next';
import { MessagesBoard } from '@/layouts/Messages/MessagesBoard';

export const metadata: Metadata = {
    title: 'Сообщения — HomeSharing',
    description: 'Переписки по заявкам и объявлениям.',
};

export default function MessagesPage() {
    return <MessagesBoard />;
}
