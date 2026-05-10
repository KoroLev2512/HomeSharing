"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import classNames from 'classnames';
import Loader from '@/shared/ui/Loader/Loader';
import { Select, type ISelectOption } from '@/shared/ui/Select';
import { HostListingsService } from '@/shared/lib/hostListingsService';
import type {
    DealType,
    IListing,
    PricePeriod,
    PropertyType,
} from '@/shared/types/listing';
import type { IListingDraft } from '@/shared/lib/hostListingsRepo';
import { publicEnv } from '@/shared/configs/publicEnv';
import { YandexMapPicker } from '@/widgets/YandexMapPicker';
import styles from './form.module.scss';

const MAX_LISTING_PHOTOS = 10;

type FormState = {
    title: string;
    dealType: DealType;
    propertyType: PropertyType;
    rooms: string;
    area: string;
    livingArea: string;
    kitchenArea: string;
    floor: string;
    totalFloors: string;
    price: string;
    pricePeriod: PricePeriod;
    deposit: string;
    city: string;
    district: string;
    metro: string;
    metroDistanceMin: string;
    latitude: string;
    longitude: string;
    address: string;
    description: string;
    amenities: string;
    images: string[];
    ownerName: string;
    ownerType: 'owner' | 'agency';
    ownerAvatar: string;
    ownerPhoneMasked: string;
};

const DEAL_OPTIONS: Array<ISelectOption<DealType>> = [
    { value: 'rent_long', label: 'Аренда (длительная)' },
    { value: 'rent_short', label: 'Аренда (посуточно)' },
    { value: 'sale', label: 'Продажа' },
];

const PROPERTY_OPTIONS: Array<ISelectOption<'flat' | 'room' | 'house'>> = [
    { value: 'flat', label: 'Квартира' },
    { value: 'room', label: 'Комната' },
    { value: 'house', label: 'Дом' },
];

const ROOM_OPTIONS: Array<ISelectOption<string>> = [
    { value: '0', label: 'Студия' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '6', label: '5 и более' },
];

const PRICE_PERIOD_OPTIONS: Array<ISelectOption<PricePeriod>> = [
    { value: 'month', label: 'в месяц' },
    { value: 'day', label: 'в сутки' },
];

const OWNER_TYPE_OPTIONS: Array<ISelectOption<'owner' | 'agency'>> = [
    { value: 'owner', label: 'Собственник' },
    { value: 'agency', label: 'Агентство' },
];

const EMPTY: FormState = {
    title: '',
    dealType: 'rent_long',
    propertyType: 'flat',
    rooms: '1',
    area: '',
    livingArea: '',
    kitchenArea: '',
    floor: '',
    totalFloors: '',
    price: '',
    pricePeriod: 'month',
    deposit: '',
    city: '',
    district: '',
    metro: '',
    metroDistanceMin: '',
    latitude: '',
    longitude: '',
    address: '',
    description: '',
    amenities: '',
    images: [],
    ownerName: '',
    ownerType: 'owner',
    ownerAvatar: '',
    ownerPhoneMasked: '',
};

/** Значение селекта «комнат»: 0 — студия, 1–4 — число, 6 — «5 и более» (в т.ч. было ровно 5). */
const roomsToFormValue = (rooms: number): string => {
    if (rooms <= 0) return '0';
    if (rooms >= 5) return '6';
    return String(rooms);
};

const fromListing = (l: IListing): FormState => ({
    title: l.title,
    dealType: l.dealType,
    propertyType: l.propertyType === 'studio' ? 'flat' : l.propertyType,
    rooms: roomsToFormValue(l.rooms),
    area: String(l.area),
    livingArea: l.livingArea != null ? String(l.livingArea) : '',
    kitchenArea: l.kitchenArea != null ? String(l.kitchenArea) : '',
    floor: String(l.floor),
    totalFloors: String(l.totalFloors),
    price: String(l.price),
    pricePeriod: l.pricePeriod ?? 'month',
    deposit: l.deposit != null ? String(l.deposit) : '',
    city: l.city,
    district: l.district ?? '',
    metro: l.metro ?? '',
    metroDistanceMin: l.metroDistanceMin != null ? String(l.metroDistanceMin) : '',
    latitude: l.latitude != null && Number.isFinite(l.latitude) ? String(l.latitude) : '',
    longitude: l.longitude != null && Number.isFinite(l.longitude) ? String(l.longitude) : '',
    address: l.address,
    description: l.description,
    amenities: (l.amenities ?? []).join(', '),
    images: (l.images ?? []).slice(0, MAX_LISTING_PHOTOS),
    ownerName: l.owner.name,
    ownerType: l.owner.type,
    ownerAvatar: l.owner.avatar ?? '',
    ownerPhoneMasked: l.owner.phoneMasked ?? '',
});

const parseInt0 = (s: string): number => {
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : 0;
};

const parseFloat0 = (s: string): number => {
    const n = Number.parseFloat(s.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};

const toDraft = (f: FormState): IListingDraft => {
    const rooms = parseInt0(f.rooms);
    const propertyType = rooms === 0 ? 'studio' : f.propertyType;
    return {
        title: f.title.trim(),
        dealType: f.dealType,
        propertyType,
        rooms,
        area: parseFloat0(f.area),
        livingArea: f.livingArea.trim() ? parseFloat0(f.livingArea) : null,
        kitchenArea: f.kitchenArea.trim() ? parseFloat0(f.kitchenArea) : null,
        floor: parseInt0(f.floor),
        totalFloors: parseInt0(f.totalFloors),
        price: parseFloat0(f.price),
        pricePeriod: f.dealType === 'sale' ? null : f.pricePeriod,
        deposit: f.deposit.trim() ? parseFloat0(f.deposit) : null,
        city: f.city.trim(),
        district: f.district.trim() || null,
        metro: f.metro.trim() || null,
        metroDistanceMin: f.metroDistanceMin.trim() ? parseInt0(f.metroDistanceMin) : null,
        latitude: (() => {
            const a = f.latitude.trim();
            const b = f.longitude.trim();
            if (!a && !b) return null;
            return parseFloat0(a);
        })(),
        longitude: (() => {
            const a = f.latitude.trim();
            const b = f.longitude.trim();
            if (!a && !b) return null;
            return parseFloat0(b);
        })(),
        address: f.address.trim(),
        description: f.description.trim(),
        amenities: f.amenities
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        images: f.images.map((s) => s.trim()).filter(Boolean).slice(0, MAX_LISTING_PHOTOS),
        ownerName: f.ownerName.trim(),
        ownerType: f.ownerType,
        ownerAvatar: f.ownerAvatar.trim() || null,
        ownerPhoneMasked: f.ownerPhoneMasked.trim() || null,
    };
};

interface IProps {
    mode: 'create' | 'edit';
    listingId?: string;
}

export const HostListingFormPage: React.FC<IProps> = ({ mode, listingId }) => {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [isLoading, setIsLoading] = useState<boolean>(mode === 'edit');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

    useEffect(() => {
        if (mode === 'create' && session?.user) {
            setForm((prev) => ({
                ...prev,
                ownerName: prev.ownerName || session.user.name || session.user.email || '',
                ownerAvatar: prev.ownerAvatar || (typeof session.user.image === 'string' ? session.user.image : ''),
            }));
        }
    }, [mode, session?.user]);

    useEffect(() => {
        if (mode !== 'edit' || !listingId) return;
        let cancelled = false;
        const load = async () => {
            try {
                const listing = await HostListingsService.getById(listingId);
                if (!cancelled) setForm(fromListing(listing));
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
        setForm((prev) => ({ ...prev, [key]: value }));
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
                    router.replace(`/host/listings`);
                    void listing;
                } else if (listingId) {
                    await HostListingsService.update(listingId, draft);
                    router.replace('/host/listings');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось сохранить');
            } finally {
                setIsSubmitting(false);
            }
        },
        [form, mode, listingId, router],
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
            setForm((p) => ({
                ...p,
                images: [...p.images, ...urls].slice(0, MAX_LISTING_PHOTOS),
            }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось загрузить фото');
        } finally {
            setIsUploadingPhotos(false);
        }
    }, []);

    const removePhotoAt = useCallback((index: number) => {
        setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
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
                    <label className={styles.field}>
                        <span>Заголовок</span>
                        <input className={styles.input} value={form.title} onChange={set('title')} required />
                    </label>
                </div>
                <div className={styles.grid3}>
                    <label className={styles.field}>
                        <span>Тип сделки</span>
                        <Select<DealType>
                            className={styles.selectRoot}
                            partsClassNames={hostSelectParts}
                            value={form.dealType}
                            onChange={(dealType) => setForm((p) => ({ ...p, dealType }))}
                            options={DEAL_OPTIONS}
                        />
                    </label>
                    <label className={styles.field}>
                        <span>Тип объекта</span>
                        <Select<'flat' | 'room' | 'house'>
                            className={styles.selectRoot}
                            partsClassNames={hostSelectParts}
                            value={form.propertyType === 'studio' ? 'flat' : form.propertyType}
                            onChange={(propertyType) => setForm((p) => ({ ...p, propertyType }))}
                            options={PROPERTY_OPTIONS}
                        />
                    </label>
                    <label className={styles.field}>
                        <span>Количество комнат</span>
                        <Select<string>
                            className={styles.selectRoot}
                            partsClassNames={hostSelectParts}
                            value={form.rooms}
                            onChange={(rooms) => setForm((p) => ({ ...p, rooms }))}
                            options={ROOM_OPTIONS}
                        />
                    </label>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Площадь и этаж</legend>
                <div className={styles.grid3}>
                    <label className={styles.field}>
                        <span>Общая, м²</span>
                        <input className={styles.input} value={form.area} onChange={set('area')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Жилая, м²</span>
                        <input className={styles.input} value={form.livingArea} onChange={set('livingArea')} />
                    </label>
                    <label className={styles.field}>
                        <span>Кухня, м²</span>
                        <input className={styles.input} value={form.kitchenArea} onChange={set('kitchenArea')} />
                    </label>
                </div>
                <div className={styles.grid2}>
                    <label className={styles.field}>
                        <span>Этаж</span>
                        <input
                            type="number"
                            min={0}
                            className={styles.input}
                            value={form.floor}
                            onChange={set('floor')}
                            required
                        />
                    </label>
                    <label className={styles.field}>
                        <span>Всего этажей</span>
                        <input
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
                    <label className={styles.field}>
                        <span>Стоимость, ₽</span>
                        <input className={styles.input} value={form.price} onChange={set('price')} required />
                    </label>
                    {isRent && (
                        <label className={styles.field}>
                            <span>Период</span>
                            <Select<PricePeriod>
                                className={styles.selectRoot}
                                partsClassNames={hostSelectParts}
                                value={form.pricePeriod}
                                onChange={(pricePeriod) => setForm((p) => ({ ...p, pricePeriod }))}
                                options={PRICE_PERIOD_OPTIONS}
                            />
                        </label>
                    )}
                    <label className={styles.field}>
                        <span>Залог, ₽</span>
                        <input className={styles.input} value={form.deposit} onChange={set('deposit')} />
                    </label>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Адрес</legend>
                <div className={styles.grid2}>
                    <label className={styles.field}>
                        <span>Город</span>
                        <input className={styles.input} value={form.city} onChange={set('city')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Район</span>
                        <input className={styles.input} value={form.district} onChange={set('district')} />
                    </label>
                </div>
                <div className={styles.grid2}>
                    <label className={styles.field}>
                        <span>Метро</span>
                        <input className={styles.input} value={form.metro} onChange={set('metro')} />
                    </label>
                    <label className={styles.field}>
                        <span>До метро, мин</span>
                        <input
                            type="number"
                            min={0}
                            className={styles.input}
                            value={form.metroDistanceMin}
                            onChange={set('metroDistanceMin')}
                        />
                    </label>
                </div>
                <label className={styles.field}>
                    <span>Полный адрес</span>
                    <input className={styles.input} value={form.address} onChange={set('address')} required />
                </label>
                <div className={styles.field}>
                    <span>Точка на Яндекс.Картах</span>
                    {/* <p className={styles.fieldHint}>Необязательно. Клик по карте, перетаскивание метки или поиск по заполненному адресу.</p> */}
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
                            setForm((p) => ({
                                ...p,
                                latitude: String(latitude),
                                longitude: String(longitude),
                            }))
                        }
                        onClear={() => setForm((p) => ({ ...p, latitude: '', longitude: '' }))}
                        geocodeQuery={[form.city, form.district, form.metro, form.address].filter(Boolean).join(', ')}
                    />
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Описание и удобства</legend>
                <label className={styles.field}>
                    <span>Описание</span>
                    <textarea
                        className={classNames(styles.input, styles.textarea)}
                        value={form.description}
                        onChange={set('description')}
                        rows={4}
                        required
                    />
                </label>
                <label className={styles.field}>
                    <span>Удобства (через запятую)</span>
                    <input
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
                            <div key={`${url}-${index}`} className={styles.photoCard}>
                                {/* eslint-disable-next-line @next/next/no-img-element -- произвольные URL из Storage */}
                                <img src={url} alt="" className={styles.photoThumb} />
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
                    <label className={styles.field}>
                        <span>Имя контактного лица / агентства</span>
                        <input className={styles.input} value={form.ownerName} onChange={set('ownerName')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Тип</span>
                        <Select<'owner' | 'agency'>
                            className={styles.selectRoot}
                            partsClassNames={hostSelectParts}
                            value={form.ownerType}
                            onChange={(ownerType) => setForm((p) => ({ ...p, ownerType }))}
                            options={OWNER_TYPE_OPTIONS}
                        />
                    </label>
                </div>
                <div className={styles.grid2}>
                    <label className={styles.field}>
                        <span>Аватар (URL)</span>
                        <input className={styles.input} value={form.ownerAvatar} onChange={set('ownerAvatar')} />
                    </label>
                    <label className={styles.field}>
                        <span>Телефон (можно с маской)</span>
                        <input
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
