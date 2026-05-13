"use client";

import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import classNames from 'classnames';
import { useSession } from 'next-auth/react';
import BookingsService from '@/shared/lib/bookingsService';
import { BookingsBoardSkeleton } from '@/layouts/Bookings/BookingsBoardSkeleton';
import {
    BOOKING_STATUS_LABEL,
    BOOKING_STATUS_TONE,
    type IBookingWithListing,
} from '@/shared/types/booking';
import styles from './styles.module.scss';

const bookingPriceFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const bookingDateFmt  = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

const formatPrice = (n: number): string =>
    Number.isFinite(n)
        ? bookingPriceFmt.format(n) + ' ₽'
        : '—';

const formatDate = (s: string): string => {
    if (!s) return '—';
    try {
        return bookingDateFmt.format(new Date(s));
    } catch {
        return s;
    }
};

export const BookingsBoard: React.FC = () => {
    const { replace } = useRouter();
    const { status } = useSession();
    const [bookings, setBookings] = useState<IBookingWithListing[] | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useLayoutEffect(() => {
        if (status === 'unauthenticated') {
            replace('/login');
        }
    }, [status, replace]);

    const load = useCallback(async () => {
        try {
            setError(null);
            const data = await BookingsService.listMyBookings();
            setBookings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить бронирования');
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            void load();
        }
    }, [status, load]);

    const handleCancel = useCallback(
        async (id: string) => {
            setPendingId(id);
            try {
                await BookingsService.cancel(id);
                await load();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось отменить бронирование');
            } finally {
                setPendingId(null);
            }
        },
        [load],
    );

    if (status === 'loading') {
        return <BookingsBoardSkeleton />;
    }

    if (status !== 'authenticated') {
        return null;
    }

    if (!bookings) {
        return <BookingsBoardSkeleton />;
    }

    return (
        <div className={styles.root}>
            <header className={styles.header}>
                <h1 className={styles.title}>Мои бронирования</h1>
                <p className={styles.headerStatus}>
                    {bookings.length > 0
                        ? `Всего ${bookings.length} ${pluralize(bookings.length, 'бронирование', 'бронирования', 'бронирований')}`
                        : 'Пока нет ни одного бронирования'}
                </p>
            </header>

            {error && <div className={styles.error}>{error}</div>}

            {bookings.length === 0 ? (
                <div className={styles.empty}>
                    <h3>Здесь будут ваши бронирования</h3>
                    <p>Найдите подходящее жильё и забронируйте его на нужные даты.</p>
                    <Link href="/listings" className={styles.primaryBtn}>
                        Перейти к объявлениям
                    </Link>
                </div>
            ) : (
                <div className={styles.list}>
                    {bookings.map((b) => {
                        const tone = BOOKING_STATUS_TONE[b.status];
                        const cover = b.listing.images?.[0] ?? '/rooms/room.png';
                        const cancellable = b.status === 'pending' || b.status === 'confirmed';
                        return (
                            <article key={b.id} className={styles.card}>
                                <Link href={`/listings/${b.listingId}`} className={styles.cover} style={{ position: 'relative' }}>
                                    <Image
                                        src={cover}
                                        alt={b.listing.title}
                                        fill
                                        sizes="(max-width: 48rem) 40vw, 10rem"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </Link>
                                <div className={styles.body}>
                                    <div className={styles.cardHead}>
                                        <Link href={`/listings/${b.listingId}`} className={styles.cardTitle}>
                                            {b.listing.title}
                                        </Link>
                                        <span className={classNames(styles.statusBadge, styles[`tone_${tone}`])}>
                                            {BOOKING_STATUS_LABEL[b.status]}
                                        </span>
                                    </div>
                                    <div className={styles.address}>
                                        {b.listing.city}
                                        {b.listing.address ? ` · ${b.listing.address}` : ''}
                                    </div>
                                    <div className={styles.meta}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaLabel}>Заезд</span>
                                            <span>{formatDate(b.startDate)}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaLabel}>Выезд</span>
                                            <span>{formatDate(b.endDate)}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaLabel}>Гостей</span>
                                            <span>{b.guestsCount}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaLabel}>Сумма</span>
                                            <span className={styles.metaTotal}>{formatPrice(b.totalPrice)}</span>
                                        </div>
                                    </div>
                                    {b.notes && (
                                        <div className={styles.notes}>
                                            <span className={styles.metaLabel}>Комментарий: </span>
                                            {b.notes}
                                        </div>
                                    )}
                                    <div className={styles.actions}>
                                        <Link href={`/listings/${b.listingId}`} className={styles.secondaryBtn}>
                                            Открыть объявление
                                        </Link>
                                        {cancellable && (
                                            <button
                                                type="button"
                                                onClick={() => handleCancel(b.id)}
                                                disabled={pendingId === b.id}
                                                className={styles.dangerBtn}
                                            >
                                                {pendingId === b.id ? 'Отменяем...' : 'Отменить'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
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
