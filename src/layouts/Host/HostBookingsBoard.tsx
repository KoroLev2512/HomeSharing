"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { HostBookingsService } from '@/shared/lib/hostBookingsService';
import {
    BOOKING_STATUS_LABEL,
    BOOKING_STATUS_TONE,
    type BookingStatus,
    type IBookingWithListing,
} from '@/shared/types/booking';
import bookingStyles from '@/layouts/Bookings/styles.module.scss';
import styles from './hostBookings.module.scss';

const formatPrice = (n: number): string =>
    Number.isFinite(n) ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽' : '—';

const formatDate = (s: string): string => {
    if (!s) return '—';
    try {
        return new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(s));
    } catch {
        return s;
    }
};

type HostAction = 'confirmed' | 'rejected' | 'completed' | 'cancelled';

const HOST_TRANSITIONS: Record<BookingStatus, HostAction[]> = {
    pending: ['confirmed', 'rejected'],
    confirmed: ['completed', 'cancelled'],
    cancelled: [],
    rejected: [],
    completed: [],
};

const ACTION_LABEL: Record<HostAction, string> = {
    confirmed: 'Подтвердить',
    rejected: 'Отклонить',
    cancelled: 'Отменить',
    completed: 'Завершить',
};

export const HostBookingsBoard: React.FC = () => {
    const [bookings, setBookings] = useState<IBookingWithListing[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const data = await HostBookingsService.list();
            setBookings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить заявки');
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleAction = useCallback(
        async (id: string, status: 'confirmed' | 'rejected' | 'completed' | 'cancelled') => {
            setPendingId(id);
            try {
                await HostBookingsService.setStatus(id, status);
                await load();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось обновить заявку');
            } finally {
                setPendingId(null);
            }
        },
        [load],
    );

    if (!bookings) {
        return <div className={bookingStyles.root}><div>Загружаем...</div></div>;
    }

    return (
        <div className={styles.root}>
            <p className={styles.subtitle}>
                {bookings.length === 0
                    ? 'Пока ни одной заявки на ваши объекты'
                    : `Всего заявок: ${bookings.length}`}
            </p>

            {error && <div className={styles.error}>{error}</div>}

            {bookings.length === 0 ? (
                <div className={styles.empty}>
                    <h3>Нет входящих заявок</h3>
                    <p>Когда гости начнут бронировать ваши объекты, заявки появятся здесь.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {bookings.map((b) => {
                        const tone = BOOKING_STATUS_TONE[b.status];
                        const allowed = HOST_TRANSITIONS[b.status];
                        const cover = b.listing.images?.[0] ?? '/rooms/room.png';
                        return (
                            <article key={b.id} className={styles.card}>
                                <Link href={`/listings/${b.listingId}`} className={styles.cover}>
                                    <img src={cover} alt={b.listing.title} loading="lazy" />
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
                                        <div>
                                            <span className={styles.metaLabel}>Заезд</span>
                                            <span>{formatDate(b.startDate)}</span>
                                        </div>
                                        <div>
                                            <span className={styles.metaLabel}>Выезд</span>
                                            <span>{formatDate(b.endDate)}</span>
                                        </div>
                                        <div>
                                            <span className={styles.metaLabel}>Гостей</span>
                                            <span>{b.guestsCount}</span>
                                        </div>
                                        <div>
                                            <span className={styles.metaLabel}>Сумма</span>
                                            <span className={styles.metaTotal}>{formatPrice(b.totalPrice)}</span>
                                        </div>
                                        <div>
                                            <span className={styles.metaLabel}>Гость</span>
                                            <span>ID: {b.guestId.slice(0, 8)}…</span>
                                        </div>
                                    </div>
                                    {b.notes && (
                                        <div className={styles.notes}>
                                            <span className={styles.metaLabel}>Комментарий: </span>
                                            {b.notes}
                                        </div>
                                    )}
                                    {allowed.length > 0 && (
                                        <div className={styles.actions}>
                                            {allowed.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => handleAction(b.id, s)}
                                                    disabled={pendingId === b.id}
                                                    className={classNames(
                                                        s === 'rejected' || s === 'cancelled'
                                                            ? styles.dangerBtn
                                                            : s === 'confirmed'
                                                                ? styles.primaryBtn
                                                                : styles.secondaryBtn,
                                                    )}
                                                >
                                                    {pendingId === b.id ? '...' : ACTION_LABEL[s]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
