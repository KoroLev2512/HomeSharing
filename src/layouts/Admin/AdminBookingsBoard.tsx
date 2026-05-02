"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { AdminService } from '@/shared/lib/adminService';
import {
    BOOKING_STATUS_LABEL,
    BOOKING_STATUS_TONE,
    type BookingStatus,
    type IBookingWithListing,
} from '@/shared/types/booking';
import styles from './table.module.scss';

const formatDate = (s: string) => {
    try {
        return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s));
    } catch { return s; }
};

const formatPrice = (n: number) =>
    Number.isFinite(n) ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽' : '—';

type StatusFilter = 'all' | BookingStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'all',       label: 'Все' },
    { value: 'pending',   label: 'Ожидает' },
    { value: 'confirmed', label: 'Подтверждено' },
    { value: 'completed', label: 'Завершено' },
    { value: 'cancelled', label: 'Отменено' },
    { value: 'rejected',  label: 'Отклонено' },
];

const ALL_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];

export const AdminBookingsBoard: React.FC = () => {
    const [bookings, setBookings]   = useState<IBookingWithListing[] | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [error, setError]         = useState<string | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);

    const load = useCallback(async (s: StatusFilter) => {
        try {
            setError(null);
            const data = await AdminService.listBookings(s === 'all' ? undefined : s);
            setBookings(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось загрузить бронирования');
        }
    }, []);

    useEffect(() => { void load(statusFilter); }, [statusFilter, load]);

    const setStatus = async (id: string, status: BookingStatus) => {
        setPendingId(id);
        try {
            const updated = await AdminService.setBookingStatus(id, status);
            setBookings((prev) =>
                prev?.map((b) => (b.id === id ? { ...b, status: updated.status } : b)) ?? null,
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось обновить статус');
        } finally {
            setPendingId(null);
        }
    };

    return (
        <div className={styles.root}>
            <div className={styles.toolbar}>
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        className={classNames(styles.filterBtn, { [styles.filterBtnActive]: statusFilter === f.value })}
                        onClick={() => setStatusFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
                {bookings && <span className={styles.count}>{bookings.length} записей</span>}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {!bookings ? (
                <div className={styles.empty}>Загрузка...</div>
            ) : bookings.length === 0 ? (
                <div className={styles.empty}>Бронирования не найдены</div>
            ) : (
                <div className={styles.list}>
                    {bookings.map((b) => {
                        const thumb = b.listing.images?.[0] ?? '/rooms/room.png';
                        const tone = BOOKING_STATUS_TONE[b.status];
                        return (
                            <div key={b.id} className={styles.card}>
                                <Link href={`/listings/${b.listingId}`} className={styles.cover}>
                                    <img src={thumb} alt="" />
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
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}>{b.listing.city}, {b.listing.address}</span>
                                    </div>
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}><strong>{formatDate(b.startDate)} — {formatDate(b.endDate)}</strong></span>
                                        <span className={styles.metaItem}>Гостей: {b.guestsCount}</span>
                                        <span className={styles.metaItem}>Итого: <strong>{formatPrice(b.totalPrice)}</strong></span>
                                    </div>
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}>Гость: {b.guestId.slice(0, 8)}…</span>
                                        {b.hostId && <span className={styles.metaItem}>Хост: {b.hostId.slice(0, 8)}…</span>}
                                    </div>
                                    {b.notes && <div className={styles.metaRow}><span className={styles.metaItem}>Заметка: {b.notes}</span></div>}
                                    <div className={styles.cardActions}>
                                        {ALL_STATUSES.filter((s) => s !== b.status).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                disabled={pendingId === b.id}
                                                className={classNames(styles.actionBtn, {
                                                    [styles.actionBtnDanger]: s === 'cancelled' || s === 'rejected',
                                                })}
                                                onClick={() => setStatus(b.id, s)}
                                            >
                                                → {BOOKING_STATUS_LABEL[s]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
