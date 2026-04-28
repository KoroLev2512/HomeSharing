"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Loader from '@/shared/ui/Loader/Loader';
import BookingsService, { HostBookingsService } from '@/shared/lib/bookingsService';
import { useFavorites } from '@/shared/lib/favorites';
import { BOOKING_STATUS_LABEL, type IBookingWithListing } from '@/shared/types/booking';
import styles from './styles.module.scss';

type NotificationItem = {
    id: string;
    title: string;
    description: string;
    date: string;
    href: string;
    tone: 'default' | 'success' | 'info';
};

const formatDateTime = (value: string): string => {
    try {
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));
    } catch {
        return value;
    }
};

const fromGuestBooking = (b: IBookingWithListing): NotificationItem => ({
    id: `guest-${b.id}`,
    title: `Обновление по бронированию «${b.listing.title}»`,
    description: `Текущий статус заявки: ${BOOKING_STATUS_LABEL[b.status]}.`,
    date: b.updatedAt || b.createdAt,
    href: '/bookings',
    tone: b.status === 'confirmed' || b.status === 'completed' ? 'success' : 'default',
});

const fromHostBooking = (b: IBookingWithListing): NotificationItem => ({
    id: `host-${b.id}`,
    title: `Новая активность по объекту «${b.listing.title}»`,
    description:
        b.status === 'pending'
            ? 'Появилась новая заявка на бронирование. Подтвердите или отклоните ее.'
            : `Статус заявки гостя: ${BOOKING_STATUS_LABEL[b.status]}.`,
    date: b.updatedAt || b.createdAt,
    href: '/host/bookings',
    tone: b.status === 'pending' ? 'info' : 'default',
});

export const NotificationsBoard: React.FC = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { count: favoritesCount } = useFavorites();
    const [items, setItems] = useState<NotificationItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        const isHost = Boolean(session?.user?.isService);

        const load = async () => {
            try {
                setError(null);
                const [guestBookings, hostBookings] = await Promise.all([
                    BookingsService.listMyBookings().catch(() => [] as IBookingWithListing[]),
                    isHost ? HostBookingsService.list().catch(() => [] as IBookingWithListing[]) : Promise.resolve([] as IBookingWithListing[]),
                ]);

                const dynamic = [
                    ...guestBookings.map(fromGuestBooking),
                    ...hostBookings.map(fromHostBooking),
                ];

                if (favoritesCount > 0) {
                    dynamic.push({
                        id: 'favorites-local',
                        title: 'Напоминание об избранном',
                        description: `У вас сохранено ${favoritesCount} ${pluralize(favoritesCount, 'объявление', 'объявления', 'объявлений')}. Проверьте обновления цен и условий.`,
                        date: new Date().toISOString(),
                        href: '/favorites',
                        tone: 'info',
                    });
                }

                dynamic.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setItems(dynamic);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось загрузить уведомления');
                setItems([]);
            }
        };

        void load();
    }, [favoritesCount, session?.user?.isService, status]);

    if (status === 'loading') {
        return <Loader />;
    }

    if (status !== 'authenticated') {
        return null;
    }

    return (
        <div className={styles.root}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Уведомления</h1>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/messages" className={styles.secondaryBtn}>Сообщения</Link>
                    <Link href="/favorites" className={styles.secondaryBtn}>Избранное</Link>
                </div>
            </header>

            {error && <div className={styles.error}>{error}</div>}

            {!items ? (
                <Loader />
            ) : items.length === 0 ? (
                <div className={styles.empty}>
                    <h3>Уведомлений пока нет</h3>
                    <p>Когда появятся заявки, изменения статусов или сохраненные объекты, они отобразятся здесь.</p>
                    <Link href="/listings" className={styles.primaryBtn}>
                        Смотреть объявления
                    </Link>
                </div>
            ) : (
                <div className={styles.list}>
                    {items.map((item) => (
                        <Link key={item.id} href={item.href} className={styles.linkCard}>
                            <article className={styles.card}>
                                <div className={styles.cardHead}>
                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <span className={styles.date}>{formatDateTime(item.date)}</span>
                                </div>
                                <p className={styles.cardText}>{item.description}</p>
                                <span className={styles[`badge_${item.tone}`]}>
                                    {item.tone === 'success' ? 'Успешно' : item.tone === 'info' ? 'Инфо' : 'Обновление'}
                                </span>
                            </article>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

const pluralize = (n: number, one: string, few: string, many: string): string => {
    const last = n % 10;
    const last2 = n % 100;
    if (last === 1 && last2 !== 11) return one;
    if ([2, 3, 4].includes(last) && ![12, 13, 14].includes(last2)) return few;
    return many;
};

