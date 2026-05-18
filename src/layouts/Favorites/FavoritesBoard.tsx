"use client";

import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Section } from '@/shared/ui/Section';
import { ListingCard, ListingCardSkeletonList } from '@/widgets/ListingCard';
import { Logotype } from '@/shared/ui/Logotype';
import { useFavorites } from '@/shared/lib/favorites';
import ListingsService from '@/shared/lib/listingsService';
import type { IListing } from '@/shared/types/listing';
import styles from './styles.module.scss';

const SIMILAR_LIMIT = 6;

export const FavoritesBoard: React.FC = () => {
    const { status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const { favorites, count } = useFavorites();
    const [items, setItems] = useState<IListing[] | null>(null);
    const [similar, setSimilar] = useState<IListing[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingSimilar, setIsLoadingSimilar] = useState<boolean>(true);
    const [view, setView] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const v = window.localStorage.getItem('homesharing.listings.view');
            if (v === 'grid' || v === 'list') setView(v);
        } catch {
            // ignore
        }
    }, []);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            if (favorites.length === 0) {
                setItems([]);
                return;
            }
            const res = await ListingsService.list({ ids: favorites, perPage: 60 });
            const byId = new Map(res.items.map((l) => [l.id, l]));
            const ordered = favorites.map((id) => byId.get(id)).filter(Boolean) as IListing[];
            setItems(ordered);
        } catch (err) {
            console.error('[FavoritesBoard] Failed to load:', err);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [favorites]);

    const loadSimilar = useCallback(async () => {
        setIsLoadingSimilar(true);
        try {
            const res = await ListingsService.list({
                excludeIds: favorites.length > 0 ? favorites : undefined,
                perPage: SIMILAR_LIMIT,
                sort: 'new',
            });
            setSimilar(res.items);
        } catch (err) {
            console.error('[FavoritesBoard] Failed to load similar:', err);
            setSimilar([]);
        } finally {
            setIsLoadingSimilar(false);
        }
    }, [favorites]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        loadSimilar();
    }, [loadSimilar]);

    const isEmpty = items !== null && items.length === 0;
    const hasNavbar = isAuthenticated;

    return (
        <div className={styles.root}>
            <div className={styles.heroBar}>
                <div className={classNames(styles.heroBarInner, { [styles.heroBarInnerFull]: isAuthenticated })}>
                    <div className={styles.heroLeft}>
                        {hasNavbar ? (
                            <h1 className={styles.heroTitle}>Избранное</h1>
                        ) : (
                            <Link href="/listings" className={styles.heroLogo} aria-label="HomeSharing">
                                <Logotype />
                            </Link>
                        )}
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/listings" className={styles.backLink}>
                            К объявлениям
                        </Link>
                    </div>
                </div>
            </div>

            <div className={classNames(styles.content, { [styles.contentFull]: isAuthenticated })}>
            <Section margin={0}>
                {!hasNavbar && <h1 className={styles.title}>Избранное</h1>}
                {count > 0 && (
                    <p className={styles.subtitle}>
                        {count} {pluralize(count, ['объявление', 'объявления', 'объявлений'])}
                    </p>
                )}
            </Section>

            <Section margin={0}>
                {isLoading && !items ? (
                    <div
                        className={classNames(
                            view === 'list' ? styles.listingsList : styles.listingsGrid,
                        )}
                    >
                        <ListingCardSkeletonList count={Math.max(3, count)} layout={view} />
                    </div>
                ) : isEmpty ? (
                    <div className={styles.emptyState}>
                        <h3>Нет сохранённых объявлений</h3>
                        <p>Нажмите «сердечко» в карточке, чтобы добавить объявление в избранное.</p>
                        <Link href="/listings" className={styles.emptyAction}>
                            Перейти к объявлениям
                        </Link>
                    </div>
                ) : (
                    <div
                        className={classNames(
                            view === 'list' ? styles.listingsList : styles.listingsGrid,
                            { [styles.listingsLoading]: isLoading },
                        )}
                    >
                        {items?.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} layout={view} />
                        ))}
                    </div>
                )}
            </Section>

            <Section margin={0}>
                <div className={styles.similarHeader}>
                    <h2 className={styles.similarTitle}>
                        {isEmpty ? 'Возможно, вам понравится' : 'Похожие объявления'}
                    </h2>
                </div>
                {isLoadingSimilar && !similar ? (
                    <div className={styles.similarGrid}>
                        <ListingCardSkeletonList count={SIMILAR_LIMIT} layout="grid" />
                    </div>
                ) : similar && similar.length > 0 ? (
                    <div className={styles.similarGrid}>
                        {similar.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} layout="grid" />
                        ))}
                    </div>
                ) : null}
            </Section>
            </div>
        </div>
    );
};

const pluralize = (n: number, forms: [string, string, string]): string => {
    const last = n % 10;
    const last2 = n % 100;
    if (last === 1 && last2 !== 11) return forms[0];
    if ([2, 3, 4].includes(last) && ![12, 13, 14].includes(last2)) return forms[1];
    return forms[2];
};
