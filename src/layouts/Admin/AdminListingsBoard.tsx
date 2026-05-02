"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { AdminService } from '@/shared/lib/adminService';
import type { IListing } from '@/shared/types/listing';
import { dealLabel, formatPrice } from '@/shared/lib/formatListing';
import styles from './table.module.scss';

type DealFilter = 'all' | 'rent_long' | 'rent_short' | 'sale';

const DEAL_FILTERS: { value: DealFilter; label: string }[] = [
    { value: 'all',        label: 'Все' },
    { value: 'rent_long',  label: 'Аренда (долгая)' },
    { value: 'rent_short', label: 'Аренда (посуточно)' },
    { value: 'sale',       label: 'Продажа' },
];

export const AdminListingsBoard: React.FC = () => {
    const [items, setItems]         = useState<IListing[] | null>(null);
    const [dealFilter, setDealFilter] = useState<DealFilter>('all');
    const [page, setPage]           = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal]         = useState(0);
    const [error, setError]         = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const load = useCallback(async (p: number, deal: DealFilter) => {
        try {
            setError(null);
            const res = await AdminService.listListings({
                page: p,
                dealType: deal === 'all' ? undefined : deal,
            });
            setItems(res.items);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось загрузить объявления');
        }
    }, []);

    useEffect(() => { void load(page, dealFilter); }, [page, dealFilter, load]);

    const handleDealFilter = (v: DealFilter) => { setDealFilter(v); setPage(1); };

    const handleDelete = async (id: string) => {
        if (confirmId !== id) { setConfirmId(id); return; }
        setDeletingId(id);
        setConfirmId(null);
        try {
            await AdminService.deleteListing(id);
            setItems((prev) => prev?.filter((l) => l.id !== id) ?? null);
            setTotal((t) => t - 1);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось удалить объявление');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className={styles.root}>
            <div className={styles.toolbar}>
                {DEAL_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        className={classNames(styles.filterBtn, { [styles.filterBtnActive]: dealFilter === f.value })}
                        onClick={() => handleDealFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
                {items && <span className={styles.count}>Всего: {total}</span>}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {!items ? (
                <div className={styles.empty}>Загрузка...</div>
            ) : items.length === 0 ? (
                <div className={styles.empty}>Объявления не найдены</div>
            ) : (
                <>
                    <div className={styles.list}>
                        {items.map((l) => {
                            const thumb = l.images?.[0] ?? '/rooms/room.png';
                            return (
                                <div key={l.id} className={styles.card}>
                                    <Link href={`/listings/${l.id}`} className={styles.cover}>
                                        <img src={thumb} alt="" />
                                    </Link>
                                    <div className={styles.body}>
                                        <div className={styles.cardHead}>
                                            <Link href={`/listings/${l.id}`} className={styles.cardTitle}>
                                                {l.title}
                                            </Link>
                                            <span className={`${styles.badge} ${styles.badgeUser}`}>
                                                {dealLabel[l.dealType]}
                                            </span>
                                        </div>
                                        <div className={styles.metaRow}>
                                            <span className={styles.metaItem}>{l.city}{l.address ? `, ${l.address}` : ''}</span>
                                        </div>
                                        <div className={styles.metaRow}>
                                            <span className={styles.metaItem}><strong>{formatPrice(l.price, l.pricePeriod ?? null)}</strong></span>
                                            <span className={styles.metaItem}>{l.rooms} комн., {l.area} м²</span>
                                            {l.ownerUserId && (
                                                <span className={styles.metaItem}>Владелец: {l.owner.name}</span>
                                            )}
                                        </div>
                                        <div className={styles.cardActions}>
                                            <Link href={`/listings/${l.id}`} className={styles.actionBtn} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                                                Просмотр
                                            </Link>
                                            <button
                                                type="button"
                                                disabled={deletingId === l.id}
                                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                onClick={() => handleDelete(l.id)}
                                            >
                                                {confirmId === l.id ? 'Подтвердить удаление' : 'Удалить'}
                                            </button>
                                            {confirmId === l.id && (
                                                <button
                                                    type="button"
                                                    className={styles.actionBtn}
                                                    onClick={() => setConfirmId(null)}
                                                >
                                                    Отмена
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                type="button"
                                className={styles.pageBtn}
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                ←
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                                .reduce<(number | '…')[]>((acc, p, i, arr) => {
                                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === '…' ? (
                                        <span key={`el-${i}`} className={styles.pageBtn} style={{ cursor: 'default', border: 'none' }}>…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            type="button"
                                            className={classNames(styles.pageBtn, { [styles.pageBtnActive]: p === page })}
                                            onClick={() => setPage(p as number)}
                                        >
                                            {p}
                                        </button>
                                    ),
                                )}
                            <button
                                type="button"
                                className={styles.pageBtn}
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
