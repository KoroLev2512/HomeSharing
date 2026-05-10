"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import type { IListing } from '@/shared/types/listing';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, LocationIcon, StarIcon } from '@/shared/icons';
import {
    buildListingLocation,
    buildListingSubtitle,
    formatPrice,
    formatPublishedAt,
    isListingSubtitleRedundantWithTitle,
} from '@/shared/lib/formatListing';
import { useFavorites } from '@/shared/lib/favorites';
import styles from './styles.module.scss';

interface IProps {
    listing: IListing;
    layout?: 'list' | 'grid';
    className?: string;
}

interface IFavoriteButtonProps {
    listingId: string;
}

const FavoriteButton: React.FC<IFavoriteButtonProps> = ({ listingId }) => {
    const { isFavorite, toggle } = useFavorites();
    const active = isFavorite(listingId);
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(listingId);
    };
    return (
        <button
            type="button"
            className={classNames(styles.favoriteButton, { [styles.favoriteButtonActive]: active })}
            onClick={handleClick}
            aria-pressed={active}
            aria-label={active ? 'Убрать из избранного' : 'Добавить в избранное'}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#ff2525' : 'none'} xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M12.1 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.65 11.54L12.1 21.35z"
                    stroke={active ? '#ff2525' : '#ffffff'}
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
};

interface ICarouselProps {
    photos: string[];
    alt: string;
}

const PhotoCarousel: React.FC<ICarouselProps> = ({ photos, alt }) => {
    const [index, setIndex] = useState(0);
    const [loaded, setLoaded] = useState<Set<number>>(new Set());

    const safeIndex = (i: number) => (i + photos.length) % photos.length;

    const goPrev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => safeIndex(i - 1));
    };

    const goNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => safeIndex(i + 1));
    };

    const markLoaded = (i: number) => {
        setLoaded((prev) => {
            if (prev.has(i)) return prev;
            const next = new Set(prev);
            next.add(i);
            return next;
        });
    };

    return (
        <div className={styles.carousel}>
            <div
                className={styles.track}
                style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
            >
                {photos.map((src, i) => (
                    <div key={`${src}-${i}`} className={styles.slide}>
                        {!loaded.has(i) && <div className={styles.slideSkeleton} aria-hidden />}
                        <img
                            src={src}
                            alt={i === 0 ? alt : ''}
                            className={classNames(styles.image, { [styles.imageLoaded]: loaded.has(i) })}
                            loading={i === 0 ? 'eager' : 'lazy'}
                            onLoad={() => markLoaded(i)}
                            draggable={false}
                        />
                    </div>
                ))}
            </div>

            {photos.length > 1 && (
                <>
                    <button
                        type="button"
                        className={classNames(styles.navButton, styles.navLeft)}
                        onClick={goPrev}
                        aria-label="Предыдущее фото"
                    >
                        <ChevronLeftIcon width={20} height={20} color="#fff" />
                    </button>
                    <button
                        type="button"
                        className={classNames(styles.navButton, styles.navRight)}
                        onClick={goNext}
                        aria-label="Следующее фото"
                    >
                        <ChevronRightIcon width={20} height={20} color="#fff" />
                    </button>

                    <div className={styles.segments}>
                        {photos.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={styles.segmentSlot}
                                onMouseEnter={() => setIndex(i)}
                                onFocus={() => setIndex(i)}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIndex(i);
                                }}
                                aria-label={`Фото ${i + 1}`}
                            >
                                <span
                                    className={classNames(styles.segment, {
                                        [styles.segmentActive]: i === index,
                                    })}
                                />
                            </button>
                        ))}
                    </div>

                    <div className={styles.photoCounter}>
                        {index + 1} / {photos.length}
                    </div>
                </>
            )}
        </div>
    );
};

export const ListingCard: React.FC<IProps> = ({ listing, layout = 'list', className }) => {
    const photos = listing.images.length > 0 ? listing.images : ['/rooms/room.png'];

    return (
        <Link
            href={`/listings/${listing.id}`}
            className={classNames(styles.card, styles[`layout-${layout}`], className)}
        >
            <div className={styles.imageWrapper}>
                <PhotoCarousel photos={photos} alt={listing.title} />

                <div className={styles.imageBadges}>
                    {listing.isVerified && <span className={styles.badgeVerified}>Проверено</span>}
                </div>

                <FavoriteButton listingId={listing.id} />
            </div>

            <div className={styles.body}>
                <div className={styles.priceRow}>
                    <span className={styles.price}>{formatPrice(listing.price, listing.pricePeriod ?? null)}</span>
                    {typeof listing.rating === 'number' && (
                        <div className={styles.rating}>
                            <StarIcon color="#FFB800" width={14} height={14} />
                            <span>{listing.rating.toFixed(1)}</span>
                            {listing.reviewsCount ? <span className={styles.reviewsCount}>({listing.reviewsCount})</span> : null}
                        </div>
                    )}
                </div>

                <h3 className={styles.title}>{listing.title}</h3>
                {!isListingSubtitleRedundantWithTitle(listing) && (
                    <div className={styles.subtitle}>{buildListingSubtitle(listing)}</div>
                )}

                <div className={styles.location}>
                    <LocationIcon width={16} height={16} color="#757575" />
                    <span className={styles.address}>{listing.address}</span>
                </div>

                {buildListingLocation(listing) && (
                    <div className={styles.metaLine}>{buildListingLocation(listing)}</div>
                )}

                <div className={styles.footer}>
                    <div className={styles.publishedAt}>
                        <CalendarIcon width={14} height={14} color="#9a9a9a" />
                        <span>{formatPublishedAt(listing.publishedAt)}</span>
                    </div>
                    <div className={styles.owner}>
                        {listing.owner.type === 'agency' ? 'Агентство' : 'Собственник'} · {listing.owner.name}
                    </div>
                </div>
            </div>
        </Link>
    );
};
