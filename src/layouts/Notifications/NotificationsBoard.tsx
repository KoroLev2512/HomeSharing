"use client";

import React, { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BookingsService from '@/shared/lib/bookingsService';
import { NotificationsBoardSkeleton } from '@/layouts/Notifications/NotificationsBoardSkeleton';
import { HostBookingsService } from '@/shared/lib/hostBookingsService';
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

const notifDateFmt = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

const formatDateTime = (value: string): string => {
    try { return notifDateFmt.format(new Date(value)); }
    catch { return value; }
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

interface DbNotification {
    id: string;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    is_read: boolean;
    created_at: string;
}

type NotificationsFeedState = {
    items: NotificationItem[] | null;
    dbNotifs: DbNotification[];
    error: string | null;
};

export const NotificationsBoard: React.FC = () => {
    const { replace } = useRouter();
    const { data: session, status } = useSession();
    const { count: favoritesCount } = useFavorites();
    const [feed, setFeed] = useState<NotificationsFeedState>({ items: null, dbNotifs: [], error: null });

    useLayoutEffect(() => {
        if (status === 'unauthenticated') {
            replace('/login');
        }
    }, [status, replace]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        const isHost = Boolean(session?.user?.isHost);

        const load = async () => {
            try {
                const [guestBookings, hostBookings, dbResponse] = await Promise.all([
                    BookingsService.listMyBookings().catch(() => [] as IBookingWithListing[]),
                    isHost ? HostBookingsService.list().catch(() => [] as IBookingWithListing[]) : Promise.resolve([] as IBookingWithListing[]),
                    fetch('/api/notifications').then((r) => r.json() as Promise<{ notifications?: DbNotification[] }>).catch(() => ({ notifications: [] })),
                ]);
                const dbNotifs = dbResponse.notifications ?? [];

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
                setFeed({ items: dynamic, dbNotifs, error: null });
            } catch (err) {
                setFeed({
                    items: [],
                    dbNotifs: [],
                    error: err instanceof Error ? err.message : 'Не удалось загрузить уведомления',
                });
            }
        };

        void load();
    }, [favoritesCount, session?.user?.isHost, status]);

    if (status === 'loading') {
        return <NotificationsBoardSkeleton />;
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

            {feed.error && <div className={styles.error}>{feed.error}</div>}

            {/* Реальные уведомления из БД (Блок 6) */}
            {feed.dbNotifs.length > 0 && (
                <div className={styles.list} style={{ marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b6b6b', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Уведомления платформы
                    </h2>
                    {feed.dbNotifs.map((n) => (
                        <Link key={n.id} href={n.link ?? '#'} className={styles.linkCard} onClick={async () => {
                            if (!n.is_read) {
                                await fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' });
                            }
                        }}>
                            <article className={styles.card} style={{ opacity: n.is_read ? 0.65 : 1 }}>
                                <div className={styles.cardHead}>
                                    <h3 className={styles.cardTitle}>{n.title}</h3>
                                    <span className={styles.date}>{formatDateTime(n.created_at)}</span>
                                </div>
                                {n.body && <p className={styles.cardText}>{n.body}</p>}
                                {!n.is_read && <span className={styles.badge_info}>Новое</span>}
                            </article>
                        </Link>
                    ))}
                </div>
            )}

            {!feed.items ? (
                <NotificationsBoardSkeleton embedded />
            ) : feed.items.length === 0 && feed.dbNotifs.length === 0 ? (
                <div className={styles.empty}>
                    <h3>Уведомлений пока нет</h3>
                    <p>Когда появятся заявки, изменения статусов или сохраненные объекты, они отобразятся здесь.</p>
                    <Link href="/listings" className={styles.primaryBtn}>
                        Смотреть объявления
                    </Link>
                </div>
            ) : (
                <div className={styles.list}>
                    {feed.items.map((item) => (
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

