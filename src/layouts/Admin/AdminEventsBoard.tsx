"use client";

import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import type { RentalEventRow } from '@/shared/lib/rentalEventLog';
import styles from './table.module.scss';

// ── Фильтры ──────────────────────────────────────────────────────────────────

type AggregateFilter = 'all' | 'booking' | 'listing' | 'user' | 'access' | 'verification';
type EventTypeFilter = 'all' | string;

const AGGREGATE_FILTERS: { value: AggregateFilter; label: string }[] = [
    { value: 'all',          label: 'Все' },
    { value: 'booking',      label: 'Бронирования' },
    { value: 'listing',      label: 'Объявления' },
    { value: 'verification', label: 'Верификация' },
    { value: 'access',       label: 'Доступ' },
    { value: 'user',         label: 'Пользователи' },
];

// ── Метки и стили ─────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
    'booking.created':     'Бронирование создано',
    'booking.confirmed':   'Бронирование подтверждено',
    'booking.cancelled':   'Бронирование отменено',
    'booking.rejected':    'Бронирование отклонено',
    'booking.completed':   'Бронирование завершено',
    'verification.started':   'Верификация запущена',
    'verification.completed': 'Верификация завершена',
    'verification.failed':    'Верификация неудачна',
    'access.granted':  'Доступ выдан',
    'access.revoked':  'Доступ отозван',
    'access.used':     'Доступ использован',
    'access.failed':   'Ошибка доступа',
    'user.registered':    'Пользователь зарегистрирован',
    'user.esia_verified': 'ЕСИА верификация',
    'payment.completed':  'Оплата завершена',
    'payment.failed':     'Ошибка оплаты',
    'property.created':   'Объявление создано',
};

const INTERPRETATION_LABELS: Record<string, string> = {
    verified:               'Подтверждено',
    not_verified:           'Не подтверждено',
    inconclusive:           'Неоднозначно',
    technical_failure:      'Тех. ошибка',
    manual_review_required: 'Требует проверки',
};

const INTERPRETATION_TONE: Record<string, string> = {
    verified:               styles.tone_success,
    not_verified:           styles.tone_danger,
    inconclusive:           styles.tone_info,
    technical_failure:      styles.tone_danger,
    manual_review_required: styles.tone_muted,
};

function eventTone(eventType: string): string {
    if (eventType.includes('cancelled') || eventType.includes('failed') || eventType.includes('rejected'))
        return styles.tone_danger;
    if (eventType.includes('confirmed') || eventType.includes('completed') || eventType.includes('granted') || eventType.includes('verified'))
        return styles.tone_success;
    if (eventType.includes('created') || eventType.includes('started') || eventType.includes('registered'))
        return styles.tone_info;
    return styles.tone_muted;
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return iso; }
}

// ── Компонент ─────────────────────────────────────────────────────────────────

export const AdminEventsBoard: React.FC = () => {
    const [items, setItems]           = useState<RentalEventRow[] | null>(null);
    const [total, setTotal]           = useState(0);
    const [page, setPage]             = useState(1);
    const [aggregate, setAggregate]   = useState<AggregateFilter>('all');
    const [eventType, setEventType]   = useState<EventTypeFilter>('all');
    const [error, setError]           = useState<string | null>(null);
    const [expanded, setExpanded]     = useState<string | null>(null);

    const limit = 20;

    const load = useCallback(async (p: number, agg: AggregateFilter, et: EventTypeFilter) => {
        try {
            setError(null);
            const q = new URLSearchParams({ limit: String(limit), offset: String((p - 1) * limit) });
            if (agg !== 'all') q.set('aggregateType', agg);
            if (et !== 'all') q.set('eventType', et);
            const res = await fetch(`/api/admin/events?${q.toString()}`);
            const data = await res.json() as { items: RentalEventRow[]; total: number };
            setItems(data.items ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setError('Не удалось загрузить журнал событий');
        }
    }, []);

    useEffect(() => { void load(page, aggregate, eventType); }, [page, aggregate, eventType, load]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const handleAgg = (v: AggregateFilter) => { setAggregate(v); setPage(1); };
    const handleEt = (e: React.ChangeEvent<HTMLSelectElement>) => { setEventType(e.target.value); setPage(1); };

    return (
        <div className={styles.root}>
            {/* Заголовок */}
            <div style={{ marginBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a' }}>
                    Аудит-журнал событий аренды
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b6b6b' }}>
                    §3.4 диплома — фиксация доменных событий платформы. Всего записей: {total}
                </p>
            </div>

            {/* Тулбар */}
            <div className={styles.toolbar} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                {AGGREGATE_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        className={classNames(styles.filterBtn, { [styles.filterBtnActive]: aggregate === f.value })}
                        onClick={() => handleAgg(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
                <div className={styles.toolbarDivider} />
                <select
                    style={{ height: '2.125rem', padding: '0 0.5rem', borderRadius: '0.5rem', border: '0.0625rem solid #d6d6d6', fontSize: '0.8125rem', background: '#fff', cursor: 'pointer' }}
                    value={eventType}
                    onChange={handleEt}
                >
                    <option value="all">Все типы</option>
                    {Object.entries(EVENT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
                {items && <span className={styles.count}>Страница {page}/{totalPages}</span>}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {/* Таблица */}
            {!items ? (
                <div className={styles.empty}>Загрузка…</div>
            ) : items.length === 0 ? (
                <div className={styles.empty}>Событий не найдено. Выполните действия на платформе — они появятся здесь.</div>
            ) : (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.thead}>
                                <th style={{ width: '11rem' }}>Время</th>
                                <th>Тип события</th>
                                <th style={{ width: '8rem' }}>Агрегат</th>
                                <th style={{ width: '10rem' }}>Aggregate ID</th>
                                <th style={{ width: '8rem' }}>Интерпретация</th>
                                <th style={{ width: '10rem' }}>Correlation ID</th>
                                <th style={{ width: '5rem' }}>Подробно</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((row) => (
                                <React.Fragment key={row.id}>
                                    <tr className={styles.tr}>
                                        <td className={styles.td} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b6b6b' }}>
                                            {formatDate(row.occurred_at)}
                                        </td>
                                        <td className={styles.td}>
                                            <span className={classNames(styles.statusBadge, eventTone(row.event_type))}>
                                                {EVENT_LABELS[row.event_type] ?? row.event_type}
                                            </span>
                                        </td>
                                        <td className={styles.td} style={{ fontSize: '0.8125rem', color: '#6b6b6b' }}>
                                            {row.aggregate_type}
                                        </td>
                                        <td className={styles.td} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#6b6b6b' }}>
                                            {row.aggregate_id.slice(0, 12)}…
                                        </td>
                                        <td className={styles.td}>
                                            {row.interpretation_status ? (
                                                <span className={classNames(styles.statusBadge, INTERPRETATION_TONE[row.interpretation_status] ?? styles.tone_muted)}>
                                                    {INTERPRETATION_LABELS[row.interpretation_status] ?? row.interpretation_status}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#bbb', fontSize: '0.75rem' }}>—</span>
                                            )}
                                        </td>
                                        <td className={styles.td} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#9a9a9a' }}>
                                            {row.correlation_id.slice(0, 10)}…
                                        </td>
                                        <td className={styles.td}>
                                            <button
                                                type="button"
                                                className={classNames(styles.actionBtn, expanded === row.id && styles.actionBtnActive)}
                                                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                                            >
                                                {expanded === row.id ? 'Скрыть' : 'JSON'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expanded === row.id && (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '0.75rem 0.875rem', background: '#fafafa', borderBottom: '0.0625rem solid #ebebeb' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                                                    {row.actor_user_id && <div><span style={{ color: '#8a8a8a' }}>Актор:</span> {row.actor_user_id}</div>}
                                                    {row.cadastral_number && <div><span style={{ color: '#8a8a8a' }}>Кад. №:</span> <code>{row.cadastral_number}</code></div>}
                                                    {row.policy_version && <div><span style={{ color: '#8a8a8a' }}>Policy:</span> {row.policy_version}</div>}
                                                    {row.source_service && <div><span style={{ color: '#8a8a8a' }}>Сервис:</span> {row.source_service}</div>}
                                                    {row.requires_manual_review && <div style={{ color: '#c1272d', fontWeight: 600 }}>⚠ Требует ручной проверки</div>}
                                                </div>
                                                <pre style={{ margin: 0, fontSize: '0.7rem', lineHeight: 1.5, background: '#f3f3f3', padding: '0.5rem', borderRadius: '0.375rem', overflowX: 'auto', maxHeight: '12rem' }}>
                                                    {JSON.stringify(row.payload, null, 2)}
                                                </pre>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button type="button" className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</button>
                            <span className={styles.pageBtn} style={{ cursor: 'default', border: 'none' }}>
                                {page} / {totalPages}
                            </span>
                            <button type="button" className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
