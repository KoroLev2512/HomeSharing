"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Loader from '@/shared/ui/Loader/Loader';
import BookingsService, { HostBookingsService } from '@/shared/lib/bookingsService';
import { BOOKING_STATUS_LABEL, type IBookingWithListing } from '@/shared/types/booking';
import styles from './styles.module.scss';

type Thread = {
    id: string;
    listingId: string;
    listingTitle: string;
    counterpart: string;
    preview: string;
    date: string;
    role: 'guest' | 'host';
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

const trimId = (id: string | null | undefined): string =>
    id ? `${id.slice(0, 6)}...${id.slice(-4)}` : 'пользователь';

const createGuestThread = (b: IBookingWithListing): Thread => ({
    id: `guest-${b.id}`,
    listingId: b.listingId,
    listingTitle: b.listing.title,
    counterpart: b.hostId ? `Арендодатель ${trimId(b.hostId)}` : 'Арендодатель',
    preview: `Статус заявки: ${BOOKING_STATUS_LABEL[b.status]}. Детали доступны в разделе бронирований.`,
    date: b.updatedAt || b.createdAt,
    role: 'guest',
});

const createHostThread = (b: IBookingWithListing): Thread => ({
    id: `host-${b.id}`,
    listingId: b.listingId,
    listingTitle: b.listing.title,
    counterpart: `Гость ${trimId(b.guestId)}`,
    preview: `Заявка гостя: ${BOOKING_STATUS_LABEL[b.status]}. Вы можете управлять ею в разделе заявок.`,
    date: b.updatedAt || b.createdAt,
    role: 'host',
});

export const MessagesBoard: React.FC = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [threads, setThreads] = useState<Thread[] | null>(null);
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

                const result = [
                    ...guestBookings.map(createGuestThread),
                    ...hostBookings.map(createHostThread),
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setThreads(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось загрузить сообщения');
                setThreads([]);
            }
        };

        void load();
    }, [session?.user?.isService, status]);

    const summary = useMemo(() => {
        if (!threads) return 'Загружаем переписки...';
        if (threads.length === 0) return 'Переписок пока нет';
        return `${threads.length} ${pluralize(threads.length, 'диалог', 'диалога', 'диалогов')}`;
    }, [threads]);

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
                    <h1 className={styles.title}>Сообщения</h1>
                    <p className={styles.subtitle}>
                        {summary}
                    </p>
                </div>
                <Link href="/bookings" className={styles.secondaryBtn}>
                    Мои бронирования
                </Link>
            </header>

            <div className={styles.info}>
                Чат в реальном времени появится на следующем этапе. Сейчас здесь собраны все диалоги по вашим заявкам и объектам.
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {!threads ? (
                <Loader />
            ) : threads.length === 0 ? (
                <div className={styles.empty}>
                    <h3>Пока нет сообщений</h3>
                    <p>Создайте первое бронирование или опубликуйте объявление, чтобы появились диалоги.</p>
                    <Link href="/listings" className={styles.primaryBtn}>
                        Перейти к объявлениям
                    </Link>
                </div>
            ) : (
                <div className={styles.list}>
                    {threads.map((t) => (
                        <article key={t.id} className={styles.card}>
                            <div className={styles.cardTop}>
                                <div>
                                    <div className={styles.listingTitle}>{t.listingTitle}</div>
                                    <div className={styles.counterpart}>{t.counterpart}</div>
                                </div>
                                <span className={styles.date}>{formatDateTime(t.date)}</span>
                            </div>
                            <p className={styles.preview}>{t.preview}</p>
                            <div className={styles.actions}>
                                <Link href={`/listings/${t.listingId}`} className={styles.secondaryBtn}>
                                    Открыть объявление
                                </Link>
                                <Link
                                    href={t.role === 'host' ? '/host/bookings' : '/bookings'}
                                    className={styles.primaryBtn}
                                >
                                    {t.role === 'host' ? 'К заявкам гостей' : 'К моим заявкам'}
                                </Link>
                            </div>
                        </article>
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
