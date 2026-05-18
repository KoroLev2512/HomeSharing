"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Section } from '@/shared/ui/Section';
import { SearchInput } from '@/widgets/SearchInput';
import { ListingCard, ListingCardSkeletonList } from '@/widgets/ListingCard';
import { ListingFilters } from '@/widgets/ListingFilters';
import { Logotype } from '@/shared/ui/Logotype';
import { Select } from '@/shared/ui/Select';
import { useFavorites } from '@/shared/lib/favorites';
import ListingsService from '@/shared/lib/listingsService';
import { mockCities } from '@/shared/configs/cities';
import type {
    DealType,
    IListing,
    IListingsFilters,
    IListingsResponse,
    ListingsSort,
} from '@/shared/types/listing';
import { dealLabelShort } from '@/shared/lib/formatListing';
import { FilterIcon } from '@/shared/icons';
import styles from './styles.module.scss';

const sortOptions: Array<{ value: ListingsSort; label: string }> = [
    { value: 'new', label: 'Новые' },
    { value: 'cheap', label: 'Дешевле' },
    { value: 'expensive', label: 'Дороже' },
    { value: 'area_desc', label: 'Большая площадь' },
];

const dealTabs: Array<{ value: DealType | undefined; label: string }> = [
    { value: undefined, label: 'Все' },
    { value: 'rent_long', label: dealLabelShort.rent_long + ' надолго' },
    { value: 'rent_short', label: dealLabelShort.rent_short },
    { value: 'sale', label: dealLabelShort.sale },
];

const VIEW_STORAGE_KEY = 'homesharing.listings.view';

const isViewMode = (v: unknown): v is 'list' | 'grid' => v === 'list' || v === 'grid';

const readSavedView = (): 'list' | 'grid' => {
    if (typeof window === 'undefined') return 'list';
    try {
        const v = window.localStorage.getItem(VIEW_STORAGE_KEY);
        return isViewMode(v) ? v : 'list';
    } catch {
        return 'list';
    }
};

export const ListingsBoard: React.FC = () => {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const { count: favoritesCount } = useFavorites();
    const [filters, setFilters] = useState<IListingsFilters>({});
    const [sort, setSort] = useState<ListingsSort>('new');
    const [page, setPage] = useState<number>(1);
    // SSR-safe: всегда стартуем с 'list', чтобы не было hydration mismatch.
    // На клиенте после mount подтягиваем сохранённое значение.
    const [view, setView] = useState<'list' | 'grid'>('list');
    const [searchQ, setSearchQ] = useState<string>('');
    const [data, setData] = useState<IListingsResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);

    useEffect(() => {
        const saved = readSavedView();
        if (saved !== view) setView(saved);
        // первый раз — без зависимостей
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateView = useCallback((next: 'list' | 'grid') => {
        setView(next);
        try {
            window.localStorage.setItem(VIEW_STORAGE_KEY, next);
        } catch {
            // ignore
        }
    }, []);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await ListingsService.list({
                ...filters,
                q: searchQ || undefined,
                sort,
                page,
                perPage: 12,
            });
            setData(res);
        } catch (err) {
            console.error('[ListingsBoard] Failed to load:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filters, sort, page, searchQ]);

    useEffect(() => {
        load();
    }, [load]);

    const handleFiltersChange = (next: IListingsFilters) => {
        setFilters(next);
        setPage(1);
    };

    const handleSortChange = (next: ListingsSort) => {
        setSort(next);
        setPage(1);
    };

    const handleDealTab = (deal: DealType | undefined) => {
        setFilters((prev) => ({ ...prev, dealType: deal }));
        setPage(1);
    };

    const handleSearchSubmit = () => {
        setPage(1);
        load();
    };

    const totalLabel = useMemo(() => {
        if (!data) return '';
        if (data.total === 0) return 'Ничего не найдено';
        const last = data.total % 10;
        const last2 = data.total % 100;
        if (last === 1 && last2 !== 11) return `${data.total} объявление`;
        if ([2, 3, 4].includes(last) && ![12, 13, 14].includes(last2)) return `${data.total} объявления`;
        return `${data.total} объявлений`;
    }, [data]);

    return (
        <div className={styles.root}>
            <div className={styles.heroBar}>
                <div className={classNames(styles.heroBarInner, { [styles.heroBarInnerFull]: isAuthenticated })}>
                    <div className={styles.heroLeft}>
                        {isAuthenticated ? (
                            <h1 className={styles.heroTitle}>Объявления</h1>
                        ) : (
                            <Link href="/listings" className={styles.heroLogo} aria-label="HomeSharing">
                                <Logotype />
                            </Link>
                        )}
                    </div>
                    <div className={styles.heroActions}>
                        <Link
                            href="/favorites"
                            className={classNames(styles.favoritesLink, {
                                [styles.favoritesLinkActive]: favoritesCount > 0,
                            })}
                            aria-label="Избранное"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill={favoritesCount > 0 ? '#ff2525' : 'none'}
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12.1 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.65 11.54L12.1 21.35z"
                                    stroke={favoritesCount > 0 ? '#ff2525' : '#1a1a1a'}
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>Избранное</span>
                            {favoritesCount > 0 && (
                                <span className={styles.favoritesCount}>
                                    {favoritesCount > 99 ? '99+' : favoritesCount}
                                </span>
                            )}
                        </Link>
                        {!isAuthenticated && (
                            <>
                                <Link href="/login" className={styles.loginLink}>
                                    Войти
                                </Link>
                                <Link href="/register" className={styles.publishLink}>
                                    Разместить объявление
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={classNames(styles.content, { [styles.contentFull]: isAuthenticated })}>
                {!isAuthenticated && (
                    <Section margin={0}>
                        <h1 className={styles.title}>Объявления</h1>
                    </Section>
                )}

                <Section margin={0}>
                    <div className={styles.dealTabsRow}>
                        {dealTabs.map((tab) => (
                            <button
                                key={tab.label}
                                type="button"
                                className={classNames(styles.dealTabButton, {
                                    [styles.dealTabButtonActive]: filters.dealType === tab.value,
                                })}
                                onClick={() => handleDealTab(tab.value)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </Section>

                <Section margin={0}>
                    <div className={styles.searchRow}>
                        <SearchInput
                            placeholder="Город, район, метро или адрес"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                            size="medium"
                            showClearButton
                            className={styles.searchInput}
                        />
                        <button type="button" className={styles.searchButton} onClick={handleSearchSubmit}>
                            Найти
                        </button>
                        <button
                            type="button"
                            className={styles.mobileFiltersButton}
                            onClick={() => setShowFiltersMobile((v) => !v)}
                            aria-label="Фильтры"
                        >
                            <FilterIcon width={22} height={22} />
                            Фильтры
                        </button>
                    </div>
                </Section>

                <Section margin={0} className={styles.contentMainSection}>
                    <div className={styles.contentRow}>
                        <div
                            className={classNames(styles.sidebar, {
                                [styles.sidebarMobileOpen]: showFiltersMobile,
                            })}
                        >
                            <ListingFilters
                                value={filters}
                                onChange={handleFiltersChange}
                                cities={mockCities}
                            />
                        </div>

                        <div className={styles.mainColumn}>
                            <div className={styles.toolbar}>
                                <div className={styles.totalLabel}>{totalLabel}</div>
                                <div className={styles.toolbarRight}>
                                    <Select<ListingsSort>
                                        value={sort}
                                        onChange={handleSortChange}
                                        options={sortOptions}
                                        triggerPrefix="Сортировка: "
                                        className={styles.sortSelect}
                                    />
                                    <div className={styles.viewToggle}>
                                        <button
                                            type="button"
                                            className={classNames(styles.viewButton, { [styles.viewButtonActive]: view === 'list' })}
                                            onClick={() => updateView('list')}
                                            aria-label="Список"
                                        >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className={classNames(styles.viewButton, { [styles.viewButtonActive]: view === 'grid' })}
                                            onClick={() => updateView('grid')}
                                            aria-label="Сетка"
                                        >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                                            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                                            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                                            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isLoading && !data ? (
                                <div className={styles.listingsInitialLoader}>
                                    <div
                                        className={classNames(styles.listingsList, {
                                            [styles.listingsGrid]: view === 'grid',
                                        })}
                                    >
                                        <ListingCardSkeletonList count={6} layout={view} />
                                    </div>
                                </div>
                            ) : data && data.items.length > 0 ? (
                                <div
                                    className={classNames(styles.listingsList, {
                                        [styles.listingsGrid]: view === 'grid',
                                        [styles.listingsLoading]: isLoading,
                                    })}
                                >
                                    {data.items.map((item: IListing) => (
                                        <ListingCard key={item.id} listing={item} layout={view} />
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyTitle}>Ничего не найдено</div>
                                    <div className={styles.emptyText}>
                                        Попробуйте изменить фильтры или сбросить параметры поиска.
                                    </div>
                                    <button type="button" className={styles.emptyButton} onClick={() => setFilters({})}>
                                        Сбросить фильтры
                                    </button>
                                </div>
                            )}

                            {data && data.totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        type="button"
                                        className={styles.pageButton}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                    >
                                        Назад
                                    </button>
                                    <div className={styles.pageInfo}>
                                        Стр. {data.page} из {data.totalPages}
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.pageButton}
                                        onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                        disabled={page >= data.totalPages}
                                    >
                                        Дальше
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
};
