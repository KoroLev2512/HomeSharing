"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
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

// ── helpers ────────────────────────────────────────────────────────────────

const today = (): string => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const tomorrow = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const nextDay = (ymd: string): string => {
    const d = new Date(`${ymd}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return toYmd(d);
};

const thisMonth = (): string => today().slice(0, 7); // YYYY-MM

const addMonths = (ym: string, n: number): string => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, (m ?? 1) - 1 + n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const ymToStartDate = (ym: string) => `${ym}-01`;

const ymToEndDate = (ym: string, months: number): string => {
    const end = addMonths(ym, months);
    return `${end}-01`;
};

const priceFormatter      = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const dateFormatter       = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
const monthTitleFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
const monthLabelFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
const shortMonthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'short' });

const formatPrice = (n: number) => priceFormatter.format(n) + ' ₽';
const formatDate  = (ymd: string) => {
    try { return dateFormatter.format(new Date(`${ymd}T00:00:00`)); }
    catch { return ymd; }
};
const formatYm = (ym: string) => {
    try { return monthLabelFormatter.format(new Date(`${ym}-01T00:00:00`)); }
    catch { return ym; }
};

const toMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const fromMonthKey = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, 1);
};
const toYmd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function pluralize(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

// ── DateField (посуточная) ─────────────────────────────────────────────────

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type BookedRange = { startDate: string; endDate: string };

function isDayBooked(ymd: string, ranges: BookedRange[]): boolean {
    return ranges.some(r => ymd >= r.startDate && ymd < r.endDate);
}

function isRangeOverlapsBooked(start: string, end: string, ranges: BookedRange[]): boolean {
    return ranges.some(r => start < r.endDate && end > r.startDate);
}

interface DateFieldProps {
    label: string;
    value: string; // '' = not selected
    min?: string;
    max?: string;
    align?: 'left' | 'right';
    bookedRanges?: BookedRange[];
    onChange: (v: string) => void;
}

export interface DateFieldHandle {
    open: () => void;
}

const DateField = forwardRef<DateFieldHandle, DateFieldProps>(
({ label, value, min, max, align = 'left', bookedRanges = [], onChange }, ref) => {
    const [open, setOpen] = useState(false);
    const [monthKey, setMonthKey] = useState(() => toMonthKey(value ? new Date(`${value}T00:00:00`) : new Date()));
    const rootRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({ open: () => setOpen(true) }));

    useEffect(() => { if (open) setMonthKey(toMonthKey(value ? new Date(`${value}T00:00:00`) : new Date())); }, [open, value]);

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const monthDate = fromMonthKey(monthKey);
    const firstDay  = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const offset    = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - offset);

    const days = Array.from({ length: 42 }).map((_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        const ymd = toYmd(d);
        const isBooked = isDayBooked(ymd, bookedRanges);
        return {
            ymd,
            day: d.getDate(),
            isCurrentMonth: d.getMonth() === monthDate.getMonth(),
            isDisabled: Boolean((min && ymd < min) || (max && ymd > max) || isBooked),
            isBooked,
        };
    });

    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <div ref={rootRef} className={styles.dateFieldWrap}>
                <button type="button"
                    className={classNames(styles.dateTrigger, { [styles.dateTriggerEmpty]: !value })}
                    onClick={() => setOpen(v => !v)}>
                    <span>{value ? formatDate(value) : 'Выберите дату'}</span>
                    <CalendarIcon width={18} height={18} color="#5a5a5a" />
                </button>
                {open && (
                    <div className={classNames(styles.calendarPopover, { [styles.calendarPopoverRight]: align === 'right' })}>
                        <div className={styles.calendarHead}>
                            <button type="button" className={styles.calendarNav}
                                onClick={() => { const p = fromMonthKey(monthKey); p.setMonth(p.getMonth() - 1); setMonthKey(toMonthKey(p)); }}>
                                <ChevronLeftIcon width={16} height={16} color="#1a1a1a" />
                            </button>
                            <span className={styles.calendarTitle}>{monthTitleFormatter.format(firstDay)}</span>
                            <button type="button" className={styles.calendarNav}
                                onClick={() => { const n = fromMonthKey(monthKey); n.setMonth(n.getMonth() + 1); setMonthKey(toMonthKey(n)); }}>
                                <ChevronRightIcon width={16} height={16} color="#1a1a1a" />
                            </button>
                        </div>
                        <div className={styles.calendarWeek}>{weekDays.map(d => <div key={d}>{d}</div>)}</div>
                        <div className={styles.calendarGrid}>
                            {days.map(d => (
                                <button key={d.ymd} type="button" disabled={d.isDisabled}
                                    className={classNames(styles.calendarDay, {
                                        [styles.calendarDayMuted]: !d.isCurrentMonth,
                                        [styles.calendarDaySelected]: d.ymd === value,
                                        [styles.calendarDayBooked]: d.isBooked,
                                    })}
                                    onClick={() => { onChange(d.ymd); setOpen(false); }}>
                                    {d.day}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </label>
    );
});
DateField.displayName = 'DateField';

// ── MonthField (помесячная) ────────────────────────────────────────────────

interface MonthFieldProps {
    label: string;
    value: string; // YYYY-MM
    minMonth?: string; // YYYY-MM
    bookedRanges?: BookedRange[];
    onChange: (v: string) => void;
}

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const MonthField: React.FC<MonthFieldProps> = ({ label, value, minMonth, bookedRanges = [], onChange }) => {
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState(() => parseInt(value.split('-')[0] ?? String(new Date().getFullYear())));
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => { if (open) setYear(parseInt(value.split('-')[0] ?? String(new Date().getFullYear()))); }, [open, value]);

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const currentYm = `${year}-`;

    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <div ref={rootRef} className={styles.dateFieldWrap}>
                <button type="button" className={styles.dateTrigger} onClick={() => setOpen(v => !v)}>
                    <span>{formatYm(value)}</span>
                    <CalendarIcon width={18} height={18} color="#5a5a5a" />
                </button>
                {open && (
                    <div className={classNames(styles.calendarPopover, styles.monthPopover)}>
                        <div className={styles.calendarHead}>
                            <button type="button" className={styles.calendarNav} onClick={() => setYear(y => y - 1)}>
                                <ChevronLeftIcon width={16} height={16} color="#1a1a1a" />
                            </button>
                            <span className={styles.calendarTitle}>{year}</span>
                            <button type="button" className={styles.calendarNav} onClick={() => setYear(y => y + 1)}>
                                <ChevronRightIcon width={16} height={16} color="#1a1a1a" />
                            </button>
                        </div>
                        <div className={styles.monthGrid}>
                            {MONTHS_RU.map((name, i) => {
                                const ym = `${year}-${String(i + 1).padStart(2, '0')}`;
                                const monthStart = `${ym}-01`;
                                const monthEnd   = `${addMonths(ym, 1)}-01`;
                                const isBooked   = isRangeOverlapsBooked(monthStart, monthEnd, bookedRanges);
                                const isDisabled = Boolean((minMonth && ym < minMonth) || isBooked);
                                const isSelected = ym === value;
                                return (
                                    <button key={ym} type="button" disabled={isDisabled}
                                        className={classNames(styles.monthCell, {
                                            [styles.monthCellSelected]: isSelected,
                                            [styles.monthCellDisabled]: isDisabled,
                                            [styles.monthCellBooked]: isBooked && !isSelected,
                                        })}
                                        onClick={() => { onChange(ym); setOpen(false); }}>
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </label>
    );
};

// ── Shared auth/owner guard ────────────────────────────────────────────────

const AuthBox: React.FC = () => (
    <div className={styles.box}>
        <div className={styles.title}>Бронирование</div>
        <div className={styles.muted}>Чтобы забронировать, войдите или зарегистрируйтесь.</div>
        <div className={styles.actionsRow}>
            <Link href="/login" className={styles.secondaryBtn}>Войти</Link>
            <Link href="/register" className={styles.primaryBtn}>Создать аккаунт</Link>
        </div>
    </div>
);

const OwnerBox: React.FC<{ listing: IListing }> = ({ listing }) => (
    <div className={styles.box}>
        <div className={styles.title}>Это ваше объявление</div>
        <div className={styles.muted}>Бронирования по этому объекту видны в разделе «Объекты».</div>
        <Link href={`/host/listings/${listing.id}/edit`} className={styles.primaryBtn}>
            Редактировать объявление
        </Link>
    </div>
);

// ── DailyRentForm (rent_short) ─────────────────────────────────────────────

const DailyRentForm: React.FC<{ listing: IListing }> = ({ listing }) => {
    const { push } = useRouter();
    const [startDate, setStartDate] = useState<string>('');
    const [endDate,   setEndDate]   = useState<string>('');
    const [guests, setGuests]       = useState(1);
    const [notes, setNotes]         = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError]   = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
    const startRef = useRef<DateFieldHandle>(null);
    const endRef   = useRef<DateFieldHandle>(null);

    useEffect(() => {
        fetch(`/api/listings/${listing.id}/availability`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.ranges) setBookedRanges(d.ranges); })
            .catch(() => {});
    }, [listing.id]);

    const calc = useMemo(
        () => (startDate && endDate && endDate > startDate
            ? computeBookingTotal('rent_short', listing.price, startDate, endDate)
            : { nights: 0, periods: 0, total: 0, periodLabel: 'night' as const }),
        [startDate, endDate, listing.price],
    );
    const nights = diffNights(startDate, endDate);
    const isValid = startDate && endDate && endDate > startDate;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate) { startRef.current?.open(); return; }
        if (!endDate || endDate <= startDate) { endRef.current?.open(); return; }
        setError(null); setSuccess(null); setIsSubmitting(true);
        try {
            await BookingsService.create({ listingId: listing.id, startDate, endDate, guestsCount: guests, notes: notes.trim() || undefined });
            setSuccess('Заявка создана. Перенаправляем...');
            setTimeout(() => push('/bookings'), 600);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось создать бронирование');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.box} onSubmit={handleSubmit}>
            <div className={styles.title}>Забронировать</div>

            <div className={styles.dateRow}>
                <DateField ref={startRef} label="Заезд"  value={startDate} min={today()} bookedRanges={bookedRanges} onChange={v => { setStartDate(v); if (endDate && endDate <= v) setEndDate(''); }} />
                <DateField ref={endRef}   label="Выезд"  value={endDate}   min={startDate ? nextDay(startDate) : tomorrow()} align="right" bookedRanges={bookedRanges} onChange={setEndDate} />
            </div>

            <label className={styles.field}>
                <span className={styles.fieldLabel}>Гостей</span>
                <input type="number" min={1} max={20} step={1} value={guests}
                    onChange={e => setGuests(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                    className={styles.input} />
            </label>

            <label className={styles.field}>
                <span className={styles.fieldLabel}>Комментарий (опционально)</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value.slice(0, 500))}
                    className={classNames(styles.input, styles.textarea)} rows={2}
                    placeholder="Например: приедем поздно вечером" />
            </label>

            <div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span>Цена за ночь</span>
                    <span>{formatPrice(listing.price)}</span>
                </div>
                {nights > 0 && (
                    <div className={styles.summaryRow}>
                        <span>Количество ночей</span>
                        <span>{nights} {pluralize(nights, 'ночь', 'ночи', 'ночей')}</span>
                    </div>
                )}
                <div className={classNames(styles.summaryRow, styles.summaryTotal)}>
                    <span>Итого</span>
                    <span>{calc.total > 0 ? formatPrice(calc.total) : '—'}</span>
                </div>
            </div>

            {error   && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Отправляем...' : 'Забронировать'}
            </button>
            <div className={styles.disclaimer}>Подтверждение от собственника обычно занимает до 24 часов.</div>
        </form>
    );
};

// ── MonthlyRentForm (rent_long) ────────────────────────────────────────────

const MonthlyRentForm: React.FC<{ listing: IListing }> = ({ listing }) => {
    const { push } = useRouter();
    const [startMonth, setStartMonth] = useState<string>(() => thisMonth());
    const [duration, setDuration]     = useState(1);
    const [notes, setNotes]           = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError]   = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);

    useEffect(() => {
        fetch(`/api/listings/${listing.id}/availability`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.ranges) setBookedRanges(d.ranges); })
            .catch(() => {});
    }, [listing.id]);

    const total = listing.price * duration;
    const endYm = addMonths(startMonth, duration);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setSuccess(null); setIsSubmitting(true);
        try {
            await BookingsService.create({
                listingId: listing.id,
                startDate: ymToStartDate(startMonth),
                endDate: ymToEndDate(startMonth, duration),
                guestsCount: 1,
                notes: notes.trim() || undefined,
            });
            setSuccess('Заявка создана. Перенаправляем...');
            setTimeout(() => push('/bookings'), 600);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось создать бронирование');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.box} onSubmit={handleSubmit}>
            <div className={styles.title}>Снять в аренду</div>

            <MonthField
                label="С какого месяца"
                value={startMonth}
                minMonth={thisMonth()}
                bookedRanges={bookedRanges}
                onChange={setStartMonth}
            />

            <label className={styles.field}>
                <span className={styles.fieldLabel}>Срок аренды (месяцев)</span>
                <div className={styles.durationRow}>
                    <button type="button" className={styles.durationBtn}
                        onClick={() => setDuration(d => Math.max(1, d - 1))} disabled={duration <= 1}>−</button>
                    <span className={styles.durationValue}>
                        {duration} {pluralize(duration, 'месяц', 'месяца', 'месяцев')}
                    </span>
                    <button type="button" className={styles.durationBtn}
                        onClick={() => setDuration(d => Math.min(24, d + 1))} disabled={duration >= 24}>+</button>
                </div>
            </label>

            <label className={styles.field}>
                <span className={styles.fieldLabel}>Комментарий (опционально)</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value.slice(0, 500))}
                    className={classNames(styles.input, styles.textarea)} rows={2}
                    placeholder="Расскажите о себе или задайте вопрос" />
            </label>

            <div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span>Цена в месяц</span>
                    <span>{formatPrice(listing.price)}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span>Период</span>
                    <span>{formatYm(startMonth)} — {formatYm(endYm)}</span>
                </div>
                <div className={classNames(styles.summaryRow, styles.summaryTotal)}>
                    <span>Итого за {duration} {pluralize(duration, 'месяц', 'месяца', 'месяцев')}</span>
                    <span>{formatPrice(total)}</span>
                </div>
            </div>

            {error   && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Отправляем...' : 'Отправить заявку'}
            </button>
            <div className={styles.disclaimer}>Собственник свяжется с вами для подтверждения.</div>
        </form>
    );
};

// ── ViewingRequestForm (sale) ──────────────────────────────────────────────

const ViewingRequestForm: React.FC<{ listing: IListing }> = ({ listing }) => {
    const { push } = useRouter();
    const [date, setDate]   = useState<string>(() => tomorrow());
    const [time, setTime]   = useState('12:00');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError]   = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setSuccess(null); setIsSubmitting(true);
        const endDate = toYmd(new Date(new Date(`${date}T00:00:00`).getTime() + 86_400_000));
        const fullNotes = [time ? `Предпочтительное время: ${time}` : '', notes.trim()].filter(Boolean).join('\n');
        try {
            await BookingsService.create({
                listingId: listing.id,
                startDate: date,
                endDate,
                guestsCount: 1,
                notes: fullNotes || undefined,
            });
            setSuccess('Заявка на просмотр отправлена. Перенаправляем...');
            setTimeout(() => push('/bookings'), 600);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось отправить заявку');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.box} onSubmit={handleSubmit}>
            <div className={styles.title}>Записаться на просмотр</div>

            <DateField
                label="Удобная дата"
                value={date}
                min={tomorrow()}
                onChange={setDate}
            />

            <label className={styles.field}>
                <span className={styles.fieldLabel}>Удобное время</span>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className={styles.input} />
            </label>

            <label className={styles.field}>
                <span className={styles.fieldLabel}>Комментарий (опционально)</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value.slice(0, 500))}
                    className={classNames(styles.input, styles.textarea)} rows={2}
                    placeholder="Вопросы, пожелания или контакт для связи" />
            </label>

            {error   && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Отправляем...' : 'Записаться на просмотр'}
            </button>
            <div className={styles.disclaimer}>Собственник свяжется с вами для подтверждения времени.</div>
        </form>
    );
};

// ── Main BookingForm ───────────────────────────────────────────────────────

export const BookingForm: React.FC<IProps> = ({ listing }) => {
    const { data: session, status } = useSession();

    const isOwner = useMemo(
        () => Boolean(session?.user?.id && listing.ownerUserId && session.user.id === listing.ownerUserId),
        [session?.user?.id, listing.ownerUserId],
    );

    if (status === 'loading') {
        return (
            <div className={styles.box}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonButton} />
            </div>
        );
    }

    if (!session?.user) return <AuthBox />;
    if (isOwner)         return <OwnerBox listing={listing} />;

    if (listing.dealType === 'sale')      return <ViewingRequestForm listing={listing} />;
    if (listing.dealType === 'rent_long') return <MonthlyRentForm    listing={listing} />;
    return <DailyRentForm listing={listing} />;
};
