"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import classNames from 'classnames';
import { AdminService } from '@/shared/lib/adminService';
import type { RosreestrCheckResult } from '@/shared/lib/adminService';
import type { IListing } from '@/shared/types/listing';
import { dealLabel, formatPrice } from '@/shared/lib/formatListing';
import { AdminCardsSkeletonList } from '@/layouts/Admin/AdminBoardSkeletons';
import styles from './table.module.scss';

type DealFilter = 'all' | 'rent_long' | 'rent_short' | 'sale';
type VerifFilter = 'all' | 'pending' | 'verified' | 'rejected';

const DEAL_FILTERS: { value: DealFilter; label: string }[] = [
    { value: 'all',        label: 'Все' },
    { value: 'rent_long',  label: 'Аренда (долгая)' },
    { value: 'rent_short', label: 'Аренда (посуточно)' },
    { value: 'sale',       label: 'Продажа' },
];

const VERIF_FILTERS: { value: VerifFilter; label: string }[] = [
    { value: 'all',      label: 'Все статусы' },
    { value: 'pending',  label: 'Ожидают проверки' },
    { value: 'verified', label: 'Подтверждены' },
    { value: 'rejected', label: 'Отклонены' },
];

const LISTING_THUMB_SIZES = '(max-width: 48rem) 40vw, 10rem';

const CN_RE = /^\d{2}:\d{2}:\d{6,7}:\d+$/;

function buildPaginationEntries(
    page: number,
    totalPages: number,
): Array<{ kind: 'page'; value: number } | { kind: 'ellipsis'; id: string }> {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
        (p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages,
    );
    const out: Array<{ kind: 'page'; value: number } | { kind: 'ellipsis'; id: string }> = [];
    for (let i = 0; i < pages.length; i++) {
        const p = pages[i]!;
        if (i > 0 && p - pages[i - 1]! > 1) {
            out.push({ kind: 'ellipsis', id: `gap-${pages[i - 1]}-${p}` });
        }
        out.push({ kind: 'page', value: p });
    }
    return out;
}

function verificationTone(l: IListing): string {
    if (l.isVerified) return styles.tone_success;
    if (l.rosreestrStatus === 'not_found' || l.rosreestrStatus === 'error') return styles.tone_danger;
    if (l.rosreestrStatus === 'found') return styles.tone_info;
    return styles.tone_muted;
}

function verificationLabel(l: IListing): string {
    if (l.isVerified) return 'Подтверждено';
    if (l.rosreestrStatus === 'found') return 'Найдено в реестре';
    if (l.rosreestrStatus === 'not_found') return 'Не найдено';
    if (l.rosreestrStatus === 'error') return 'Ошибка проверки';
    return 'Не проверено';
}

function formatCadCost(raw?: string): string {
    if (!raw) return '—';
    const n = parseFloat(raw);
    if (!isFinite(n)) return raw;
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

// Inline verification panel
interface VerifPanelProps {
    listing: IListing;
    onUpdate: (patch: Partial<IListing>) => void;
}

const VerifPanel: React.FC<VerifPanelProps> = ({ listing, onUpdate }) => {
    const [cn, setCn] = useState(listing.cadastralNumber ?? '');
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<RosreestrCheckResult | null>(
        listing.rosreestrStatus && listing.rosreestrStatus !== 'pending' && listing.rosreestrData
            ? { found: listing.rosreestrStatus === 'found', cn: listing.cadastralNumber ?? '', data: listing.rosreestrData }
            : null,
    );
    const [error, setError] = useState<string | null>(null);
    const cnRef = useRef<HTMLInputElement>(null);

    const cnValid = CN_RE.test(cn.trim());

    const handleCheck = async () => {
        setError(null);
        setChecking(true);
        try {
            const res = await AdminService.checkRosreestr(cn.trim());
            setResult(res);
            // persist: save cn + rosreestr result
            await AdminService.verifyListing(listing.id, {
                cadastralNumber: cn.trim(),
                rosreestrStatus: res.found ? 'found' : 'not_found',
                rosreestrData: res.data ?? null,
            });
            onUpdate({
                cadastralNumber: cn.trim(),
                rosreestrStatus: res.found ? 'found' : 'not_found',
                rosreestrData: res.data ?? null,
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Ошибка';
            setError(msg);
            await AdminService.verifyListing(listing.id, {
                cadastralNumber: cn.trim(),
                rosreestrStatus: 'error',
                rosreestrData: null,
            }).catch(() => undefined);
            onUpdate({ cadastralNumber: cn.trim(), rosreestrStatus: 'error', rosreestrData: null });
        } finally {
            setChecking(false);
        }
    };

    const handleApprove = async () => {
        setSaving(true);
        try {
            await AdminService.verifyListing(listing.id, { isVerified: true });
            onUpdate({ isVerified: true });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка');
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        setSaving(true);
        try {
            await AdminService.verifyListing(listing.id, { isVerified: false, rosreestrStatus: 'not_found' });
            onUpdate({ isVerified: false, rosreestrStatus: 'not_found' });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка');
        } finally {
            setSaving(false);
        }
    };

    const d = result?.data;

    return (
        <div className={styles.verifPanel}>
            <div className={styles.verifRow}>
                <input
                    ref={cnRef}
                    className={classNames(styles.verifInput, !cnValid && cn ? styles.verifInputError : undefined)}
                    value={cn}
                    onChange={(e) => { setCn(e.target.value); setError(null); }}
                    placeholder="77:01:0001001:1234"
                    disabled={checking || saving}
                />
                <button
                    type="button"
                    className={classNames(styles.actionBtn, styles.actionBtnActive)}
                    disabled={!cnValid || checking || saving}
                    onClick={handleCheck}
                >
                    {checking ? 'Запрос...' : 'Запросить в Росреестр'}
                </button>
            </div>

            {!cnValid && cn && (
                <div className={styles.verifHint}>Формат: NN:NN:NNNNNNN:NNN (например 77:01:0001001:1234)</div>
            )}

            {error && <div className={styles.verifError}>{error}</div>}

            {result && (
                <div className={styles.verifResult}>
                    {result.found && d ? (
                        <>
                            <div className={styles.verifResultHeader}>
                                <span className={classNames(styles.statusBadge, styles.tone_info)}>
                                    {d.name ?? d.purposeName ?? 'Объект найден'}
                                </span>
                                <span className={classNames(
                                    styles.statusBadge,
                                    d.statecd === '6' || d.statecd === '27' ? styles.tone_success : styles.tone_danger,
                                )}>
                                    {d.statecdLabel ?? '—'}
                                </span>
                            </div>

                            <table className={styles.verifTable}>
                                <thead>
                                    <tr>
                                        <th>Параметр</th>
                                        <th>Объявление</th>
                                        <th>Росреестр</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <CompareRow
                                        label="Кадастровый №"
                                        listed={listing.cadastralNumber ?? '—'}
                                        actual={d.cn}
                                        match={!!listing.cadastralNumber && listing.cadastralNumber === d.cn}
                                    />
                                    <CompareRow
                                        label="Адрес"
                                        listed={[listing.city, listing.address].filter(Boolean).join(', ')}
                                        actual={d.address ?? '—'}
                                        match={false}
                                        noCheck
                                    />
                                    <CompareRow
                                        label="Площадь, м²"
                                        listed={String(listing.area)}
                                        actual={d.areaValue ? parseFloat(d.areaValue).toFixed(1) : '—'}
                                        match={d.areaValue ? Math.abs(listing.area - parseFloat(d.areaValue)) < 1 : false}
                                    />
                                    {d.floors && (
                                        <CompareRow
                                            label="Этажей в здании"
                                            listed={String(listing.totalFloors)}
                                            actual={d.floors}
                                            match={String(listing.totalFloors) === d.floors}
                                        />
                                    )}
                                    {d.yearBuilt && (
                                        <tr className={styles.verifTr}>
                                            <td className={styles.verifTd}>Год постройки</td>
                                            <td className={styles.verifTd}>—</td>
                                            <td className={styles.verifTd}>{d.yearBuilt}</td>
                                            <td className={styles.verifTd} />
                                        </tr>
                                    )}
                                    <tr className={styles.verifTr}>
                                        <td className={styles.verifTd}>Кад. стоимость</td>
                                        <td className={styles.verifTd}>—</td>
                                        <td className={styles.verifTd}>{formatCadCost(d.cadCost)}</td>
                                        <td className={styles.verifTd} />
                                    </tr>
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <div className={classNames(styles.statusBadge, styles.tone_danger)} style={{ display: 'inline-flex' }}>
                            Объект не найден в реестре по номеру {result.cn}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.verifActions}>
                <button
                    type="button"
                    className={classNames(styles.actionBtn, listing.isVerified && styles.actionBtnActive)}
                    disabled={saving || checking || listing.isVerified}
                    onClick={handleApprove}
                >
                    {listing.isVerified ? '✓ Подтверждено' : 'Подтвердить'}
                </button>
                <button
                    type="button"
                    className={classNames(styles.actionBtn, styles.actionBtnDanger)}
                    disabled={saving || checking}
                    onClick={handleReject}
                >
                    Отклонить
                </button>
            </div>
        </div>
    );
};

interface CompareRowProps {
    label: string;
    listed: string;
    actual: string;
    match: boolean;
    noCheck?: boolean;
}

const CompareRow: React.FC<CompareRowProps> = ({ label, listed, actual, match, noCheck }) => (
    <tr className={styles.verifTr}>
        <td className={styles.verifTd}>{label}</td>
        <td className={styles.verifTd}>{listed}</td>
        <td className={styles.verifTd}>{actual}</td>
        <td className={styles.verifTd}>
            {!noCheck && (
                <span style={{ color: match ? '#1d7a3d' : '#c1272d', fontWeight: 600, fontSize: '1rem' }}>
                    {match ? '✓' : '✗'}
                </span>
            )}
        </td>
    </tr>
);

export const AdminListingsBoard: React.FC = () => {
    const [items, setItems]           = useState<IListing[] | null>(null);
    const [dealFilter, setDealFilter] = useState<DealFilter>('all');
    const [verifFilter, setVerifFilter] = useState<VerifFilter>('all');
    const [page, setPage]             = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal]           = useState(0);
    const [error, setError]           = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmId, setConfirmId]   = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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

    const handleUpdate = (id: string, patch: Partial<IListing>) => {
        setItems((prev) => prev?.map((l) => l.id === id ? { ...l, ...patch } : l) ?? null);
    };

    const visibleItems = verifFilter === 'all' ? (items ?? []) : (items ?? []).filter((l) => {
        if (verifFilter === 'verified') return l.isVerified;
        if (verifFilter === 'rejected') return !l.isVerified && (l.rosreestrStatus === 'not_found' || l.rosreestrStatus === 'error');
        return !l.isVerified && (l.rosreestrStatus === 'pending' || l.rosreestrStatus === 'found');
    });

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
                <div className={styles.toolbarDivider} />
                {VERIF_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        className={classNames(styles.filterBtn, { [styles.filterBtnActive]: verifFilter === f.value })}
                        onClick={() => setVerifFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
                {items && <span className={styles.count}>Всего: {total}</span>}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {!items ? (
                <AdminCardsSkeletonList />
            ) : visibleItems.length === 0 ? (
                <div className={styles.empty}>Объявления не найдены</div>
            ) : (
                <>
                    <div className={styles.list}>
                        {visibleItems.map((l) => {
                            const thumb = l.images?.[0] ?? '/rooms/room.png';
                            const expanded = expandedId === l.id;
                            return (
                                <div key={l.id} className={classNames(styles.card, expanded && styles.cardExpanded)}>
                                    <Link href={`/listings/${l.id}`} className={styles.cover} style={{ position: 'relative' }}>
                                        <Image
                                            src={thumb}
                                            alt=""
                                            fill
                                            sizes={LISTING_THUMB_SIZES}
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </Link>
                                    <div className={styles.body}>
                                        <div className={styles.cardHead}>
                                            <Link href={`/listings/${l.id}`} className={styles.cardTitle}>
                                                {l.title}
                                            </Link>
                                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                                <span className={`${styles.badge} ${styles.badgeUser}`}>
                                                    {dealLabel[l.dealType]}
                                                </span>
                                                <span className={classNames(styles.statusBadge, verificationTone(l))}>
                                                    {verificationLabel(l)}
                                                </span>
                                            </div>
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
                                        {l.cadastralNumber && (
                                            <div className={styles.metaRow}>
                                                <span className={styles.metaItem} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                    Кад. №: {l.cadastralNumber}
                                                </span>
                                            </div>
                                        )}
                                        <div className={styles.cardActions}>
                                            <Link href={`/listings/${l.id}`} className={styles.actionBtn} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                                                Просмотр
                                            </Link>
                                            <button
                                                type="button"
                                                className={classNames(styles.actionBtn, expanded && styles.actionBtnActive)}
                                                onClick={() => setExpandedId(expanded ? null : l.id)}
                                            >
                                                {expanded ? 'Скрыть проверку' : 'Проверить через Росреестр'}
                                            </button>
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

                                    {expanded && (
                                        <div className={styles.verifPanelWrap}>
                                            <VerifPanel
                                                listing={l}
                                                onUpdate={(patch) => handleUpdate(l.id, patch)}
                                            />
                                        </div>
                                    )}
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
                            {buildPaginationEntries(page, totalPages).map((entry) =>
                                entry.kind === 'ellipsis' ? (
                                    <span key={entry.id} className={styles.pageBtn} style={{ cursor: 'default', border: 'none' }}>…</span>
                                ) : (
                                    <button
                                        key={`page-${entry.value}`}
                                        type="button"
                                        className={classNames(styles.pageBtn, { [styles.pageBtnActive]: entry.value === page })}
                                        onClick={() => setPage(entry.value)}
                                    >
                                        {entry.value}
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
