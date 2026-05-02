"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { HostListingsService } from '@/shared/lib/hostListingsService';
import type { IListing } from '@/shared/types/listing';
import { dealLabel, formatPrice } from '@/shared/lib/formatListing';
import styles from './listings.module.scss';

export const HostListingsBoard: React.FC = () => {
    const [listings, setListings] = useState<IListing[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const data = await HostListingsService.list();
            setListings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить объявления');
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleDelete = useCallback(
        async (id: string) => {
            if (!window.confirm('Удалить объявление? Это действие нельзя отменить.')) return;
            setPendingId(id);
            try {
                await HostListingsService.remove(id);
                await load();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось удалить объявление');
            } finally {
                setPendingId(null);
            }
        },
        [load],
    );

    return (
        <div className={styles.root}>
            <div className={styles.toolbar}>
                <p className={styles.subtitle}>
                    {listings === null
                        ? 'Загружаем...'
                        : listings.length === 0
                            ? 'Пока ни одного объявления'
                            : `Активных объявлений: ${listings.length}`}
                </p>
                <Link href="/host/listings/new" className={styles.primaryBtn}>
                    + Создать объявление
                </Link>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {listings && listings.length === 0 ? (
                <div className={styles.empty}>
                    <h3>Разместите первое объявление</h3>
                    <p>Заполните карточку объекта — гости смогут забронировать его прямо на сайте.</p>
                    <Link href="/host/listings/new" className={styles.primaryBtn}>
                        Создать объявление
                    </Link>
                </div>
            ) : null}

            {listings && listings.length > 0 && (
                <div className={styles.list}>
                    {listings.map((l) => {
                        const cover = l.images?.[0] ?? '/rooms/room.png';
                        return (
                            <article key={l.id} className={styles.card}>
                                <Link href={`/listings/${l.id}`} className={styles.cover}>
                                    <img src={cover} alt={l.title} loading="lazy" />
                                </Link>
                                <div className={styles.body}>
                                    <div className={styles.cardHead}>
                                        <Link href={`/listings/${l.id}`} className={styles.cardTitle}>
                                            {l.title}
                                        </Link>
                                        <span className={styles.dealBadge}>{dealLabel[l.dealType]}</span>
                                    </div>
                                    <div className={styles.address}>
                                        {l.city}
                                        {l.address ? ` · ${l.address}` : ''}
                                    </div>
                                    <div className={styles.metaRow}>
                                        <span>
                                            <strong>{l.rooms === 0 ? 'Студия' : `${l.rooms}-комн.`}</strong>
                                            {' · '}
                                            {l.area} м²
                                        </span>
                                        <span className={styles.price}>{formatPrice(l.price, l.pricePeriod ?? null)}</span>
                                    </div>
                                    <div className={styles.actions}>
                                        <Link href={`/host/listings/${l.id}/edit`} className={styles.secondaryBtn}>
                                            Редактировать
                                        </Link>
                                        <Link href={`/listings/${l.id}`} className={styles.secondaryBtn}>
                                            Открыть как гость
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(l.id)}
                                            disabled={pendingId === l.id}
                                            className={styles.dangerBtn}
                                        >
                                            {pendingId === l.id ? 'Удаляем...' : 'Удалить'}
                                        </button>
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
