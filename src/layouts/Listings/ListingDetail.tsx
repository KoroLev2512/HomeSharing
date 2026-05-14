"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import classNames from 'classnames';
import ListingsService from '@/shared/lib/listingsService';
import type { IListing } from '@/shared/types/listing';
import {
    buildListingLocation,
    buildListingSubtitle,
    dealLabel,
    formatPrice,
    formatPublishedAt,
} from '@/shared/lib/formatListing';
import { ListingCard } from '@/widgets/ListingCard';
import { ListingDetailSkeleton } from './ListingDetailSkeleton';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    LocationIcon,
    StarIcon,
} from '@/shared/icons';
import { useFavorites } from '@/shared/lib/favorites';
import { BookingForm } from '@/widgets/BookingForm';
import Image from 'next/image';
import styles from './detail.module.scss';

interface IProps {
    id: string;
}

export const ListingDetail: React.FC<IProps> = ({ id }) => {
    const { data: session } = useSession();
    const { isFavorite, toggle: toggleFavorite } = useFavorites();
    const [listing, setListing] = useState<IListing | null>(null);
    const [similar, setSimilar] = useState<IListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [photoIdx, setPhotoIdx] = useState(0);
    const [phoneOpen, setPhoneOpen] = useState(false);
    const [loadedPhotos, setLoadedPhotos] = useState<Set<number>>(new Set());

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await ListingsService.getById(id);
                if (cancelled) return;
                if (!res) {
                    setNotFound(true);
                    return;
                }
                setListing(res.listing);
                setSimilar(res.similar);
            } catch (err) {
                console.error('[ListingDetail] load error:', err);
                if (!cancelled) setNotFound(true);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const photosCount = listing?.images.length ?? 0;

    const goPrev = useCallback(() => {
        if (!photosCount) return;
        setPhotoIdx((i) => (i - 1 + photosCount) % photosCount);
    }, [photosCount]);

    const goNext = useCallback(() => {
        if (!photosCount) return;
        setPhotoIdx((i) => (i + 1) % photosCount);
    }, [photosCount]);

    const goPrevRef = useRef(goPrev);
    const goNextRef = useRef(goNext);
    goPrevRef.current = goPrev;
    goNextRef.current = goNext;

    useEffect(() => {
        if (!listing) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goPrevRef.current();
            else if (e.key === 'ArrowRight') goNextRef.current();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [listing]);

    const markLoaded = (i: number) => {
        setLoadedPhotos((prev) => {
            if (prev.has(i)) return prev;
            const next = new Set(prev);
            next.add(i);
            return next;
        });
    };

    if (isLoading) {
        return <ListingDetailSkeleton />;
    }

    if (notFound || !listing) {
        return (
            <div className={styles.root}>
                <div className={styles.notFound}>
                    <h2>Объявление не найдено</h2>
                    <p>Возможно, оно было снято с публикации.</p>
                    <Link href="/listings" className={styles.primaryLink}>
                        Вернуться к объявлениям
                    </Link>
                </div>
            </div>
        );
    }

    const photos = listing.images.length ? listing.images : ['/rooms/room.png'];
    const favored = isFavorite(listing.id);
    const heroTitle = buildListingSubtitle(listing);
    const ownerAvatarSrc = listing.owner.avatar === '/users/user_1.png'
        ? '/users/user_1.webp'
        : (listing.owner.avatar || '/users/user_1.webp');

    return (
        <div className={styles.root}>
            <div className={styles.heroBar}>
                <div className={styles.heroBarInner}>
                    <h1 className={styles.heroTitle}>{heroTitle}</h1>
                    <Link href="/listings" className={styles.heroBackLink}>
                        Все объявления
                    </Link>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.headerBlock}>
                    <div className={styles.dealBadge}>{dealLabel[listing.dealType]}</div>
                    <div className={styles.addressRow}>
                        <LocationIcon width={18} height={18} color="#1a1a1a" />
                        <span>{listing.address}</span>
                        {buildListingLocation(listing) && <span className={styles.metaInline}> · {buildListingLocation(listing)}</span>}
                    </div>
                </div>

                <div className={styles.layout}>
                    <div className={styles.leftColumn}>
                        <div className={styles.gallery}>
                        <div
                            className={styles.galleryTrack}
                            style={{ transform: `translate3d(-${photoIdx * 100}%, 0, 0)` }}
                        >
                            {photos.map((src, i) => (
                                <div key={`${src}-${i}`} className={styles.gallerySlide}>
                                    {!loadedPhotos.has(i) && <div className={styles.gallerySkeleton} aria-hidden />}
                                    <img
                                        src={src}
                                        alt={i === 0 ? listing.title : ''}
                                        className={classNames(styles.galleryImage, {
                                            [styles.galleryImageLoaded]: loadedPhotos.has(i),
                                        })}
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        onLoad={() => markLoaded(i)}
                                        draggable={false}
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className={classNames(styles.galleryFavorite, { [styles.galleryFavoriteActive]: favored })}
                            onClick={() => toggleFavorite(listing.id)}
                            aria-pressed={favored}
                            aria-label={favored ? 'Убрать из избранного' : 'Сохранить в избранное'}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill={favored ? '#ff2525' : 'none'} xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M12.1 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.65 11.54L12.1 21.35z"
                                    stroke={favored ? '#ff2525' : '#ffffff'}
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {photos.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className={classNames(styles.galleryNav, styles.galleryNavLeft)}
                                    onClick={goPrev}
                                    aria-label="Предыдущее"
                                >
                                    <ChevronLeftIcon width={24} height={24} color="#fff" />
                                </button>
                                <button
                                    type="button"
                                    className={classNames(styles.galleryNav, styles.galleryNavRight)}
                                    onClick={goNext}
                                    aria-label="Следующее"
                                >
                                    <ChevronRightIcon width={24} height={24} color="#fff" />
                                </button>
                                <div className={styles.galleryCounter}>
                                    {photoIdx + 1} / {photos.length}
                                </div>
                                <div className={styles.galleryDots} aria-hidden>
                                    {photos.map((_, i) => (
                                        <button
                                            type="button"
                                            key={i}
                                            className={classNames(styles.galleryDot, {
                                                [styles.galleryDotActive]: i === photoIdx,
                                            })}
                                            onClick={() => setPhotoIdx(i)}
                                            aria-label={`Фото ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                        {photos.length > 1 && (
                            <div className={styles.thumbStrip}>
                                {photos.map((p, i) => (
                                    <button
                                        type="button"
                                        key={p + i}
                                        className={classNames(styles.thumb, { [styles.thumbActive]: i === photoIdx })}
                                        onClick={() => setPhotoIdx(i)}
                                        style={{ position: 'relative' }}
                                    >
                                        <Image
                                            src={p}
                                            alt=""
                                            fill
                                            sizes="(max-width: 48rem) 100vw, min(90vw, 48rem)"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                    <div className={styles.specs}>
                        <h3 className={styles.sectionTitle}>Параметры</h3>
                        <div className={styles.specsGrid}>
                            <div className={styles.specRow}>
                                <span className={styles.specKey}>Тип</span>
                                <span className={styles.specValue}>
                                    {listing.propertyType === 'house' ? 'Дом' : listing.propertyType === 'room' ? 'Комната' : 'Квартира'}
                                </span>
                            </div>
                            <div className={styles.specRow}>
                                <span className={styles.specKey}>Комнат</span>
                                <span className={styles.specValue}>{listing.rooms === 0 ? 'Студия' : listing.rooms}</span>
                            </div>
                            <div className={styles.specRow}>
                                <span className={styles.specKey}>Общая площадь</span>
                                <span className={styles.specValue}>{listing.area} м²</span>
                            </div>
                            {listing.livingArea && (
                                <div className={styles.specRow}>
                                    <span className={styles.specKey}>Жилая площадь</span>
                                    <span className={styles.specValue}>{listing.livingArea} м²</span>
                                </div>
                            )}
                            {listing.kitchenArea && (
                                <div className={styles.specRow}>
                                    <span className={styles.specKey}>Кухня</span>
                                    <span className={styles.specValue}>{listing.kitchenArea} м²</span>
                                </div>
                            )}
                            <div className={styles.specRow}>
                                <span className={styles.specKey}>Этаж</span>
                                <span className={styles.specValue}>
                                    {listing.floor} из {listing.totalFloors}
                                </span>
                            </div>
                            {listing.metro && (
                                <div className={styles.specRow}>
                                    <span className={styles.specKey}>Метро</span>
                                    <span className={styles.specValue}>
                                        {listing.metro}
                                        {listing.metroDistanceMin ? ` · ${listing.metroDistanceMin} мин` : ''}
                                    </span>
                                </div>
                            )}
                            {listing.deposit && (
                                <div className={styles.specRow}>
                                    <span className={styles.specKey}>Залог</span>
                                    <span className={styles.specValue}>{formatPrice(listing.deposit, null)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {listing.amenities.length > 0 && (
                        <div className={styles.amenities}>
                            <h3 className={styles.sectionTitle}>Удобства</h3>
                            <div className={styles.amenitiesList}>
                                {listing.amenities.map((a) => (
                                    <span key={a} className={styles.amenityChip}>
                                        {a}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.description}>
                        <h3 className={styles.sectionTitle}>Описание</h3>
                        <p className={styles.descriptionText}>{listing.description}</p>
                    </div>
                </div>

                    <aside className={styles.rightColumn}>
                        <div className={styles.priceBox}>
                        <div className={styles.price}>{formatPrice(listing.price, listing.pricePeriod ?? null)}</div>
                        {typeof listing.rating === 'number' && (
                            <div className={styles.ratingRow}>
                                <StarIcon color="#FFB800" width={16} height={16} />
                                <span>{listing.rating.toFixed(1)}</span>
                                {listing.reviewsCount ? <span className={styles.reviewsCount}>· {listing.reviewsCount} отзывов</span> : null}
                            </div>
                        )}
                        <div className={styles.publishedAt}>Опубликовано {formatPublishedAt(listing.publishedAt)}</div>

                        <div className={styles.ownerCard}>
                            <img
                                src={ownerAvatarSrc}
                                alt={listing.owner.name}
                                className={styles.ownerAvatar}
                            />
                            <div className={styles.ownerInfo}>
                                <div className={styles.ownerName}>{listing.owner.name}</div>
                                <div className={styles.ownerType}>
                                    {listing.owner.type === 'agency' ? 'Агентство' : 'Собственник'}
                                </div>
                            </div>
                        </div>

                        {phoneOpen ? (
                            <div className={styles.phoneRevealed}>
                                {listing.owner.phoneMasked ?? '+7 (---) --- -- --'}
                            </div>
                        ) : (
                            <button type="button" className={styles.phoneButton} onClick={() => setPhoneOpen(true)}>
                                Показать телефон
                            </button>
                        )}

                        <button
                            type="button"
                            className={classNames(styles.saveButton, { [styles.saveButtonActive]: favored })}
                            onClick={() => toggleFavorite(listing.id)}
                            aria-pressed={favored}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={favored ? '#ff2525' : 'none'} xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M12.1 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.65 11.54L12.1 21.35z"
                                    stroke={favored ? '#ff2525' : '#1a1a1a'}
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>{favored ? 'В избранном' : 'Сохранить'}</span>
                        </button>

                        {session?.user && (
                            <button type="button" className={styles.primaryButton}>
                                Написать сообщение
                            </button>
                        )}
                        </div>

                        {listing.dealType !== 'sale' && <BookingForm listing={listing} />}
                    </aside>
                </div>

                {similar.length > 0 && (
                    <div className={styles.similarSection}>
                        <h2 className={styles.similarTitle}>Похожие предложения</h2>
                        <div className={styles.similarGrid}>
                            {similar.map((item) => (
                                <ListingCard key={item.id} listing={item} layout="grid" />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
