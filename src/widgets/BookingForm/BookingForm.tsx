"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import classNames from 'classnames';
import type { IListing } from '@/shared/types/listing';
import { computeBookingTotal, diffNights } from '@/shared/lib/bookingPricing';
import BookingsService from '@/shared/lib/bookingsService';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@/shared/icons';
import styles from './styles.module.scss';

interface IProps {
    listing: IListing;
}

const today = (): string => {
    const d = new Date();
    const tz = d.getTimezoneOffset();
    return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 10);
};

const tomorrow = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tz = d.getTimezoneOffset();
    return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 10);
};

const priceFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const dateFormatter  = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
const monthTitleFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });

const formatPriceCompact = (n: number): string => {
    if (!Number.isFinite(n)) return '—';
    return priceFormatter.format(n) + ' ₽';
};

const toMonthKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const fromMonthKey = (key: string): Date => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
};
const toYmd = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatHumanDate = (ymd: string): string => {
    try { return dateFormatter.format(new Date(`${ymd}T00:00:00`)); }
    catch { return ymd; }
};

interface IDateFieldProps {
    label: string;
    value: string;
    min?: string;
    max?: string;
    onChange: (next: string) => void;
}

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const DateField: React.FC<IDateFieldProps> = ({ label, value, min, max, onChange }) => {
    const [open, setOpen] = useState(false);
    const [monthKey, setMonthKey] = useState<string>(() => toMonthKey(new Date(`${value}T00:00:00`)));
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        setMonthKey(toMonthKey(new Date(`${value}T00:00:00`)));
    }, [open, value]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const monthDate = fromMonthKey(monthKey);
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthLabel = monthTitleFormatter.format(firstDay);
    const jsWeekday = firstDay.getDay(); // 0=Sun..6=Sat
    const mondayFirstOffset = (jsWeekday + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayFirstOffset);

    const days = Array.from({ length: 42 }).map((_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        const ymd = toYmd(d);
        const isCurrentMonth = d.getMonth() === monthDate.getMonth();
        const isDisabled = Boolean((min && ymd < min) || (max && ymd > max));
        return { ymd, day: d.getDate(), isCurrentMonth, isDisabled };
    });

    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <div ref={rootRef} className={styles.dateFieldWrap}>
                <button type="button" className={styles.dateTrigger} onClick={() => setOpen((v) => !v)}>
                    <span>{formatHumanDate(value)}</span>
                    <CalendarIcon width={18} height={18} color="#5a5a5a" />
                </button>
                {open && (
                    <div className={styles.calendarPopover}>
                        <div className={styles.calendarHead}>
                            <button
                                type="button"
                                className={styles.calendarNav}
                                onClick={() => {
                                    const prev = fromMonthKey(monthKey);
                                    prev.setMonth(prev.getMonth() - 1);
                                    setMonthKey(toMonthKey(prev));
                                }}
                            >
                                <ChevronLeftIcon width={16} height={16} color="#1a1a1a" />
                            </button>
                            <span className={styles.calendarTitle}>{monthLabel}</span>
                            <button
                                type="button"
                                className={styles.calendarNav}
                                onClick={() => {
                                    const next = fromMonthKey(monthKey);
                                    next.setMonth(next.getMonth() + 1);
                                    setMonthKey(toMonthKey(next));
                                }}
                            >
                                <ChevronRightIcon width={16} height={16} color="#1a1a1a" />
                            </button>
                        </div>
                        <div className={styles.calendarWeek}>
                            {weekDays.map((d) => (
                                <div key={d}>{d}</div>
                            ))}
                        </div>
                        <div className={styles.calendarGrid}>
                            {days.map((d) => (
                                <button
                                    key={d.ymd}
                                    type="button"
                                    disabled={d.isDisabled}
                                    className={classNames(styles.calendarDay, {
                                        [styles.calendarDayMuted]: !d.isCurrentMonth,
                                        [styles.calendarDaySelected]: d.ymd === value,
                                    })}
                                    onClick={() => {
                                        onChange(d.ymd);
                                        setOpen(false);
                                    }}
                                >
                                    {d.day}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </label>
    );
};

export const BookingForm: React.FC<IProps> = ({ listing }) => {
    const { data: session, status } = useSession();
    const { push } = useRouter();

    const [startDate, setStartDate] = useState<string>(() => today());
    const [endDate,   setEndDate]   = useState<string>(() => tomorrow());
    const [guests, setGuests] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const isOwner = useMemo(
        () => Boolean(session?.user?.id && listing.ownerUserId && session.user.id === listing.ownerUserId),
        [session?.user?.id, listing.ownerUserId],
    );

    const calc = useMemo(() => {
        if (!startDate || !endDate || endDate <= startDate) {
            return { nights: 0, periods: 0, total: 0, periodLabel: 'unit' as const };
        }
        return computeBookingTotal(listing.dealType, listing.price, startDate, endDate);
    }, [startDate, endDate, listing.dealType, listing.price]);

    const nights = diffNights(startDate, endDate);
    const isDatesValid = startDate && endDate && endDate > startDate;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDatesValid) {
            setError('Выберите корректные даты заезда и выезда');
            return;
        }
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);
        try {
            const booking = await BookingsService.create({
                listingId: listing.id,
                startDate,
                endDate,
                guestsCount: guests,
                notes: notes.trim() || undefined,
            });
            setSuccess('Заявка на бронирование создана. Перенаправляем...');
            setTimeout(() => {
                push('/bookings');
            }, 600);
            void booking;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось создать бронирование');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className={styles.box}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonButton} />
            </div>
        );
    }

    if (!session?.user) {
        return (
            <div className={styles.box}>
                <div className={styles.title}>Бронирование</div>
                <div className={styles.muted}>
                    Чтобы забронировать, войдите или зарегистрируйтесь.
                </div>
                <div className={styles.actionsRow}>
                    <Link href="/login" className={styles.secondaryBtn}>
                        Войти
                    </Link>
                    <Link href="/register" className={styles.primaryBtn}>
                        Создать аккаунт
                    </Link>
                </div>
            </div>
        );
    }

    if (isOwner) {
        return (
            <div className={styles.box}>
                <div className={styles.title}>Это ваше объявление</div>
                <div className={styles.muted}>Бронирования по этому объекту видны в разделе «Объекты».</div>
                <Link href={`/host/listings/${listing.id}/edit`} className={styles.primaryBtn}>
                    Редактировать объявление
                </Link>
            </div>
        );
    }

    const periodLabel =
        calc.periodLabel === 'night'
            ? `${calc.periods} ${pluralize(calc.periods, 'ночь', 'ночи', 'ночей')}`
            : calc.periodLabel === 'month'
                ? `${calc.periods} ${pluralize(calc.periods, 'месяц', 'месяца', 'месяцев')}`
                : '';

    return (
        <form className={styles.box} onSubmit={handleSubmit}>
            <div className={styles.title}>Забронировать</div>

            <div className={styles.dateRow}>
                <DateField
                    label="Заезд"
                    value={startDate}
                    min={today()}
                    max={endDate || undefined}
                    onChange={setStartDate}
                />
                <DateField
                    label="Выезд"
                    value={endDate}
                    min={startDate || today()}
                    onChange={setEndDate}
                />
            </div>

            <label className={styles.field}>
                <span className={styles.fieldLabel}>Гостей</span>
                <input
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                    className={styles.input}
                />
            </label>

            <label className={styles.field}>
                <span className={styles.fieldLabel}>Комментарий собственнику (опционально)</span>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                    className={classNames(styles.input, styles.textarea)}
                    rows={2}
                    placeholder="Например: приедем поздно вечером"
                />
            </label>

            <div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span>Цена</span>
                    <span>{formatPriceCompact(listing.price)}</span>
                </div>
                {nights > 0 && (
                    <div className={styles.summaryRow}>
                        <span>Длительность</span>
                        <span>{nights} {pluralize(nights, 'ночь', 'ночи', 'ночей')}{periodLabel ? ` · ${periodLabel}` : ''}</span>
                    </div>
                )}
                <div className={classNames(styles.summaryRow, styles.summaryTotal)}>
                    <span>Итого</span>
                    <span>{calc.total > 0 ? formatPriceCompact(calc.total) : '—'}</span>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isSubmitting || !isDatesValid || calc.total <= 0}
            >
                {isSubmitting ? 'Отправляем...' : 'Забронировать'}
            </button>

            <div className={styles.disclaimer}>
                Подтверждение от собственника обычно занимает до 24 часов.
            </div>
        </form>
    );
};

function pluralize(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}
