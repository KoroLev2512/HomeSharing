"use client";

import React, { useCallback, useEffect, useId, useMemo, useReducer, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import classNames from 'classnames';
import Loader from '@/shared/ui/Loader/Loader';
import { Select } from '@/shared/ui/Select';
import { HostListingsService } from '@/shared/lib/hostListingsService';
import type { DealType, PricePeriod } from '@/shared/types/listing';
import { publicEnv } from '@/shared/configs/publicEnv';
import { YandexMapPicker } from '@/widgets/YandexMapPicker';
import Image from 'next/image';
import {
    DEAL_OPTIONS,
    EMPTY,
    fromListing,
    MAX_LISTING_PHOTOS,
    OWNER_TYPE_OPTIONS,
    PRICE_PERIOD_OPTIONS,
    PROPERTY_OPTIONS,
    ROOM_OPTIONS,
    parseFloat0,
    toDraft,
    type FormState,
} from './hostListingFormModel';
import { hostListingFormReducer } from './hostListingFormReducer';
import styles from './form.module.scss';

interface IProps {
    mode: 'create' | 'edit';
    listingId?: string;
}

export const HostListingFormPage: React.FC<IProps> = ({ mode, listingId }) => {
    const { replace } = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [form, dispatch] = useReducer(hostListingFormReducer, EMPTY);
    const [isLoading, setIsLoading] = useState<boolean>(mode === 'edit');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

    const baseFieldId = useId();
    const fid = (suffix: string) => `${baseFieldId}-${suffix}`;

    useEffect(() => {
        if (mode !== 'create' || !session?.user) return;
        dispatch({
            type: 'hydrateOwnerFromSession',
            payload: {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
            },
        });
    }, [mode, session?.user]);

    useEffect(() => {
        if (mode !== 'edit' || !listingId) return;
        let cancelled = false;
        const load = async () => {
            try {
                const listing = await HostListingsService.getById(listingId);
                if (!cancelled) dispatch({ type: 'replace', state: fromListing(listing) });
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось загрузить объявление');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [mode, listingId]);

    const set = useCallback(<K extends keyof FormState>(key: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.value as FormState[K];
        dispatch({ type: 'patch', patch: { [key]: value } as Partial<FormState> });
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            const latT = form.latitude.trim();
            const lngT = form.longitude.trim();
            if ((latT && !lngT) || (!latT && lngT)) {
                return setError('Задайте точку на карте полностью или нажмите «Сбросить точку»');
            }
            const draft = toDraft(form);
            if (!draft.title) return setError('Введите заголовок');
            if (!draft.city) return setError('Укажите город');
            if (!draft.address) return setError('Укажите адрес');
            if (!draft.description) return setError('Опишите объект');
            if (draft.area <= 0) return setError('Площадь должна быть больше 0');
            if (draft.price <= 0) return setError('Стоимость должна быть больше 0');
            if (draft.totalFloors < draft.floor) return setError('Этаж не может быть выше всего этажей');

            setIsSubmitting(true);
            try {
                if (mode === 'create') {
                    const listing = await HostListingsService.create(draft);
                    replace(`/host/listings`);
                    void listing;
                } else if (listingId) {
                    await HostListingsService.update(listingId, draft);
                    replace('/host/listings');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось сохранить');
            } finally {
                setIsSubmitting(false);
            }
        },
        [form, mode, listingId, replace],
    );

    const isRent = form.dealType !== 'sale';

    const heading = useMemo(() => (mode === 'create' ? 'Добавление объявления' : 'Редактирование объявления'), [mode]);

    const hostSelectParts = useMemo(
        () => ({
            trigger: styles.selectTrigger,
            triggerOpen: styles.selectTriggerOpen,
            panel: styles.selectPanel,
            option: styles.selectOption,
            optionActive: styles.selectOptionActive,
            optionSelected: styles.selectOptionSelected,
            chevron: styles.selectChevron,
            chevronOpen: styles.selectChevronOpen,
        }),
        [],
    );

    const uploadPickedPhotos = useCallback(async (fileList: FileList | File[], currentImages: string[]) => {
        const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return;
        const remaining = MAX_LISTING_PHOTOS - currentImages.length;
        if (remaining <= 0) return;
        const take = files.slice(0, remaining);

        setError(null);
        setIsUploadingPhotos(true);
        try {
            const urls: string[] = [];
            for (const file of take) {
                urls.push(await HostListingsService.uploadListingImage(file));
            }
            dispatch({ type: 'appendImages', urls });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось загрузить фото');
        } finally {
            setIsUploadingPhotos(false);
        }
    }, []);

    const removePhotoAt = useCallback((index: number) => {
        dispatch({ type: 'removeImageAt', index });
    }, []);

    if (sessionStatus === 'loading' || isLoading) {
        return <Loader />;
    }

    return (
        <form className={styles.root} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
                <h2 className={styles.heading}>{heading}</h2>
                {/* <Link href="/host/listings" className={styles.linkBack}>
                    ← Все мои объявления
                </Link> */}
            </div>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Основное</legend>
                <div className={styles.row}>
                    <label htmlFor={fid('title')} className={styles.field}>
                        <span>Заголовок</span>
                        <input id={fid('title')} className={styles.input} value={form.title} onChange={set('title')} required />
                    </label>
                </div>
                <div className={styles.grid3}>
                    <div className={styles.field} role="group" aria-labelledby={fid('dealType')}>
                        <span id={fid('dealType')}>Тип сделки</span>
                        <Select<DealType>
                            className={styles.selectRoot}
                            partsClassNames={hostSelectParts}
                            value={form.dealType}
                            onChange={(dealType) => dispatch({ type: 'patch', patch: { dealType } })}
                            options={DEAL_OPTIONS}
                            ariaLabelledBy={fid('dealType')}
                        />
                    </div>
                    <div className={styles.field} role="group" aria-labelledby={fid('propertyType')}>
                        <span id={fid('propertyType')}>Тип объекта</span>
                        <Select<'flat' | 'room' | 'house'>
                            className={styles.selectRoot}
                            partsClassNames={hostSelectParts}
                            value={form.propertyType === 'studio' ? 'flat' : form.propertyType}
                            onChange={(propertyType) => dispatch({ type: 'patch', patch: { propertyType } })}
                            options={PROPERTY_OPTIONS}
                            ariaLabelledBy={fid('propertyType')}
                        />
                    </div>
                    <div className={styles.field} role="group" aria-labelledby={fid('rooms')}>
                        <span id={fid('rooms')}>Количество комнат</span>
                        <Select<string>
                            className={styles.selectRoot}
                            partsClassNames={hostSelectParts}
                            value={form.rooms}
                            onChange={(rooms) => dispatch({ type: 'patch', patch: { rooms } })}
                            options={ROOM_OPTIONS}
                            ariaLabelledBy={fid('rooms')}
                        />
                    </div>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Площадь и этаж</legend>
                <div className={styles.grid3}>
                    <label htmlFor={fid('area')} className={styles.field}>
                        <span>Общая, м²</span>
                        <input id={fid('area')} className={styles.input} value={form.area} onChange={set('area')} required />
                    </label>
                    <label htmlFor={fid('livingArea')} className={styles.field}>
                        <span>Жилая, м²</span>
                        <input id={fid('livingArea')} className={styles.input} value={form.livingArea} onChange={set('livingArea')} />
                    </label>
                    <label htmlFor={fid('kitchenArea')} className={styles.field}>
                        <span>Кухня, м²</span>
                        <input id={fid('kitchenArea')} className={styles.input} value={form.kitchenArea} onChange={set('kitchenArea')} />
                    </label>
                </div>
                <div className={styles.grid2}>
                    <label htmlFor={fid('floor')} className={styles.field}>
                        <span>Этаж</span>
                        <input
                            id={fid('floor')}
                            type="number"
                            min={0}
                            className={styles.input}
                            value={form.floor}
                            onChange={set('floor')}
                            required
                        />
                    </label>
                    <label htmlFor={fid('totalFloors')} className={styles.field}>
                        <span>Всего этажей</span>
                        <input
                            id={fid('totalFloors')}
                            type="number"
                            min={0}
                            className={styles.input}
                            value={form.totalFloors}
                            onChange={set('totalFloors')}
                            required
                        />
                    </label>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Цена</legend>
                <div className={classNames(isRent ? styles.grid3 : styles.grid2)}>
                    <label htmlFor={fid('price')} className={styles.field}>
                        <span>Стоимость, ₽</span>
                        <input id={fid('price')} className={styles.input} value={form.price} onChange={set('price')} required />
                    </label>
                    {isRent && (
                        <div className={styles.field} role="group" aria-labelledby={fid('pricePeriod')}>
                            <span id={fid('pricePeriod')}>Период</span>
                            <Select<PricePeriod>
                                className={styles.selectRoot}
                                partsClassNames={hostSelectParts}
                                value={form.pricePeriod}
                                onChange={(pricePeriod) => dispatch({ type: 'patch', patch: { pricePeriod } })}
                                options={PRICE_PERIOD_OPTIONS}
                                ariaLabelledBy={fid('pricePeriod')}
                            />
                        </div>
                    )}
                    <label htmlFor={fid('deposit')} className={styles.field}>
                        <span>Залог, ₽</span>
                        <input id={fid('deposit')} className={styles.input} value={form.deposit} onChange={set('deposit')} />
                    </label>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Адрес</legend>
                <div className={styles.grid2}>
                    <label htmlFor={fid('city')} className={styles.field}>
                        <span>Город</span>
                        <input id={fid('city')} className={styles.input} value={form.city} onChange={set('city')} required />
                    </label>
                    <label htmlFor={fid('district')} className={styles.field}>
                        <span>Район</span>
                        <input id={fid('district')} className={styles.input} value={form.district} onChange={set('district')} />
                    </label>
                </div>
                <div className={styles.grid2}>
                    <label htmlFor={fid('metro')} className={styles.field}>
                        <span>Метро</span>
                        <input id={fid('metro')} className={styles.input} value={form.metro} onChange={set('metro')} />
                    </label>
                    <label htmlFor={fid('metroDistanceMin')} className={styles.field}>
                        <span>До метро, мин</span>
                        <input
                            id={fid('metroDistanceMin')}
                            type="number"
                            min={0}
                            className={styles.input}
                            value={form.metroDistanceMin}
                            onChange={set('metroDistanceMin')}
                        />
                    </label>
                </div>
                <label htmlFor={fid('address')} className={styles.field}>
                    <span>Полный адрес</span>
                    <input id={fid('address')} className={styles.input} value={form.address} onChange={set('address')} required placeholder="Невский проспект, 28" />
                </label>
                <label htmlFor={fid('cadastralNumber')} className={styles.field}>
                    <span>Кадастровый номер <span style={{ fontWeight: 400, color: '#8a8a8a' }}>(необязательно, пример: 77:01:0001001:1234)</span></span>
                    <input
                        id={fid('cadastralNumber')}
                        className={styles.input}
                        value={form.cadastralNumber}
                        onChange={set('cadastralNumber')}
                        placeholder="NN:NN:NNNNNNN:NNN"
                        pattern="\d{2}:\d{2}:\d{6,7}:\d+"
                        title="Формат: NN:NN:NNNNNNN:NNN"
                    />
                </label>
                <div className={styles.field}>
                    <YandexMapPicker
                        apiKey={publicEnv.yandexMapsApiKey}
                        value={
                            form.latitude.trim() && form.longitude.trim()
                                ? {
                                      latitude: parseFloat0(form.latitude),
                                      longitude: parseFloat0(form.longitude),
                                  }
                                : null
                        }
                        onChange={(latitude, longitude) =>
                            dispatch({
                                type: 'patch',
                                patch: { latitude: String(latitude), longitude: String(longitude) },
                            })
                        }
                        onClear={() => dispatch({ type: 'patch', patch: { latitude: '', longitude: '' } })}
                        onAddressResolved={(info) =>
                            dispatch({
                                type: 'patch',
                                patch: {
                                    ...(info.city ? { city: info.city } : {}),
                                    ...(info.address ? { address: info.address } : {}),
                                },
                            })
                        }
                        geocodeQuery={[form.city, form.district, form.metro, form.address].filter(Boolean).join(', ')}
                    />
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Описание и удобства</legend>
                <label htmlFor={fid('description')} className={styles.field}>
                    <span>Описание</span>
                    <textarea
                        id={fid('description')}
                        className={classNames(styles.input, styles.textarea)}
                        value={form.description}
                        onChange={set('description')}
                        rows={4}
                        required
                    />
                </label>
                <label htmlFor={fid('amenities')} className={styles.field}>
                    <span>Удобства (через запятую)</span>
                    <input
                        id={fid('amenities')}
                        className={styles.input}
                        value={form.amenities}
                        onChange={set('amenities')}
                        placeholder="Wi-Fi, Кондиционер, Парковка"
                    />
                </label>
                <div className={styles.field}>
                    <span>Фотографии</span>
                    <p className={styles.fieldHint}>До {MAX_LISTING_PHOTOS} файлов: JPG, PNG, WebP или GIF, до 5 МБ каждый.</p>
                    <div className={styles.photosGrid}>
                        {form.images.map((url, index) => (
                            <div key={url} className={styles.photoCard}>
                                <Image
                                    src={url}
                                    alt=""
                                    fill
                                    sizes="(max-width: 48rem) 30vw, 8rem"
                                    style={{ objectFit: 'cover' }}
                                />
                                <button
                                    type="button"
                                    className={styles.photoRemove}
                                    onClick={() => removePhotoAt(index)}
                                    aria-label="Удалить фото"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                        <path
                                            d="M6 6l12 12M18 6L6 18"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {form.images.length < MAX_LISTING_PHOTOS && (
                            <div
                                className={classNames(styles.photoAdd, {
                                    [styles.photoAddBusy]: isUploadingPhotos,
                                })}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (isUploadingPhotos) return;
                                    void uploadPickedPhotos(e.dataTransfer.files, form.images);
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    multiple
                                    className={styles.photoAddInput}
                                    disabled={isUploadingPhotos}
                                    onChange={(e) => {
                                        const { files } = e.target;
                                        e.target.value = '';
                                        if (files?.length) void uploadPickedPhotos(files, form.images);
                                    }}
                                />
                                {isUploadingPhotos ? (
                                    <span className={styles.photoAddLabel}>Загрузка…</span>
                                ) : (
                                    <>
                                        <span className={styles.photoAddPlus} aria-hidden>
                                            +
                                        </span>
                                        <span className={styles.photoAddLabel}>Добавить</span>
                                        <span className={styles.photoAddHint}>или перетащите сюда</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Контактные данные</legend>
                <div className={styles.grid2}>
                    <label htmlFor={fid('ownerName')} className={styles.field}>
                        <span>Имя контактного лица / агентства</span>
                        <input id={fid('ownerName')} className={styles.input} value={form.ownerName} onChange={set('ownerName')} required />
                    </label>
                    <div className={styles.field} role="group" aria-labelledby={fid('ownerType')}>
                        <span id={fid('ownerType')}>Тип</span>
                        <Select<'owner' | 'agency'>
                            className={styles.selectRoot}
                            partsClassNames={hostSelectParts}
                            value={form.ownerType}
                            onChange={(ownerType) => dispatch({ type: 'patch', patch: { ownerType } })}
                            options={OWNER_TYPE_OPTIONS}
                            ariaLabelledBy={fid('ownerType')}
                        />
                    </div>
                </div>
                <div className={styles.grid2}>
                    <label htmlFor={fid('ownerAvatar')} className={styles.field}>
                        <span>Аватар (URL)</span>
                        <input id={fid('ownerAvatar')} className={styles.input} value={form.ownerAvatar} onChange={set('ownerAvatar')} />
                    </label>
                    <label htmlFor={fid('ownerPhoneMasked')} className={styles.field}>
                        <span>Телефон (можно с маской)</span>
                        <input
                            id={fid('ownerPhoneMasked')}
                            className={styles.input}
                            value={form.ownerPhoneMasked}
                            onChange={set('ownerPhoneMasked')}
                            placeholder="+7 (***) *** ** **"
                        />
                    </label>
                </div>
            </fieldset>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formFooter}>
                <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Сохраняем...' : mode === 'create' ? 'Опубликовать' : 'Сохранить изменения'}
                </button>
                <Link href="/host/listings" className={styles.secondaryBtn}>
                    Отменить
                </Link>
            </div>
        </form>
    );
};
