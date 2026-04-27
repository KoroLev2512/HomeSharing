"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import classNames from 'classnames';
import Loader from '@/shared/ui/Loader/Loader';
import { HostListingsService } from '@/shared/lib/bookingsService';
import type {
    DealType,
    IListing,
    PricePeriod,
    PropertyType,
} from '@/shared/types/listing';
import type { IListingDraft } from '@/shared/lib/hostListingsRepo';
import styles from './form.module.scss';

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
    address: string;
    description: string;
    amenities: string;
    images: string;
    ownerName: string;
    ownerType: 'owner' | 'agency';
    ownerAvatar: string;
    ownerPhoneMasked: string;
};

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
    address: '',
    description: '',
    amenities: '',
    images: '',
    ownerName: '',
    ownerType: 'owner',
    ownerAvatar: '',
    ownerPhoneMasked: '',
};

const fromListing = (l: IListing): FormState => ({
    title: l.title,
    dealType: l.dealType,
    propertyType: l.propertyType,
    rooms: String(l.rooms),
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
    address: l.address,
    description: l.description,
    amenities: (l.amenities ?? []).join(', '),
    images: (l.images ?? []).join('\n'),
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

const toDraft = (f: FormState): IListingDraft => ({
    title: f.title.trim(),
    dealType: f.dealType,
    propertyType: f.propertyType,
    rooms: parseInt0(f.rooms),
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
    address: f.address.trim(),
    description: f.description.trim(),
    amenities: f.amenities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    images: f.images
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ownerName: f.ownerName.trim(),
    ownerType: f.ownerType,
    ownerAvatar: f.ownerAvatar.trim() || null,
    ownerPhoneMasked: f.ownerPhoneMasked.trim() || null,
});

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

    const heading = useMemo(() => (mode === 'create' ? 'Новое объявление' : 'Редактирование объявления'), [mode]);

    if (sessionStatus === 'loading' || isLoading) {
        return <Loader />;
    }

    return (
        <form className={styles.root} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
                <h2 className={styles.heading}>{heading}</h2>
                <Link href="/host/listings" className={styles.linkBack}>
                    ← Все мои объявления
                </Link>
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
                        <select className={styles.input} value={form.dealType} onChange={set('dealType')}>
                            <option value="rent_long">Аренда (длительная)</option>
                            <option value="rent_short">Аренда (посуточно)</option>
                            <option value="sale">Продажа</option>
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Тип объекта</span>
                        <select className={styles.input} value={form.propertyType} onChange={set('propertyType')}>
                            <option value="flat">Квартира</option>
                            <option value="studio">Студия</option>
                            <option value="room">Комната</option>
                            <option value="house">Дом</option>
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Комнат</span>
                        <input
                            type="number"
                            min={0}
                            max={20}
                            className={styles.input}
                            value={form.rooms}
                            onChange={set('rooms')}
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
                            <select className={styles.input} value={form.pricePeriod} onChange={set('pricePeriod')}>
                                <option value="month">в месяц</option>
                                <option value="day">в сутки</option>
                            </select>
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
                <label className={styles.field}>
                    <span>Фотографии (URL по одному в строке)</span>
                    <textarea
                        className={classNames(styles.input, styles.textarea)}
                        value={form.images}
                        onChange={set('images')}
                        rows={3}
                        placeholder="/rooms/room.png"
                    />
                </label>
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
                        <select className={styles.input} value={form.ownerType} onChange={set('ownerType')}>
                            <option value="owner">Собственник</option>
                            <option value="agency">Агентство</option>
                        </select>
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
