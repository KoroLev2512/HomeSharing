"use client";

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import type { IListingsFilters } from '@/shared/types/listing';
import { CitySelect } from './CitySelect';
import styles from './styles.module.scss';

interface IProps {
    value: IListingsFilters;
    onChange: (next: IListingsFilters) => void;
    cities: string[];
    className?: string;
}

const roomOptions: Array<{ value: number; label: string }> = [
    { value: 0, label: 'Студия' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4+' },
];

const numberOrUndefined = (v: string): number | undefined => {
    const cleaned = v.replace(/\D/g, '');
    if (!cleaned) return undefined;
    const n = parseInt(cleaned, 10);
    return Number.isFinite(n) ? n : undefined;
};

type RangeDraft = {
    priceMin: string;
    priceMax: string;
    areaMin: string;
    areaMax: string;
};

const rangeDraftFromValue = (v: IListingsFilters): RangeDraft => ({
    priceMin: v.priceMin ? String(v.priceMin) : '',
    priceMax: v.priceMax ? String(v.priceMax) : '',
    areaMin: v.areaMin ? String(v.areaMin) : '',
    areaMax: v.areaMax ? String(v.areaMax) : '',
});

export const ListingFilters: React.FC<IProps> = ({ value, onChange, cities, className }) => {
    const [rangeDraft, setRangeDraft] = useState<RangeDraft>(() => rangeDraftFromValue(value));

    useEffect(() => {
        setRangeDraft(rangeDraftFromValue(value));
    }, [value.priceMin, value.priceMax, value.areaMin, value.areaMax]);

    const toggleRoom = (room: number) => {
        const current = new Set(value.rooms ?? []);
        if (current.has(room)) current.delete(room);
        else current.add(room);
        onChange({ ...value, rooms: current.size ? Array.from(current).sort() : undefined });
    };

    const commitPriceMin = () => onChange({ ...value, priceMin: numberOrUndefined(rangeDraft.priceMin) });
    const commitPriceMax = () => onChange({ ...value, priceMax: numberOrUndefined(rangeDraft.priceMax) });
    const commitAreaMin = () => onChange({ ...value, areaMin: numberOrUndefined(rangeDraft.areaMin) });
    const commitAreaMax = () => onChange({ ...value, areaMax: numberOrUndefined(rangeDraft.areaMax) });

    const handleCity = (city: string | undefined) => {
        onChange({ ...value, city });
    };

    const reset = () => onChange({ dealType: value.dealType });

    return (
        <aside className={classNames(styles.filters, className)}>
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Комнаты</div>
                <div className={styles.roomChips}>
                    {roomOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={classNames(styles.chip, {
                                [styles.chipActive]: (value.rooms ?? []).includes(opt.value),
                            })}
                            onClick={() => toggleRoom(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Цена, ₽</div>
                <div className={styles.rangeRow}>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="от"
                        value={rangeDraft.priceMin}
                        onChange={(e) => setRangeDraft((d) => ({ ...d, priceMin: e.target.value }))}
                        onBlur={commitPriceMin}
                        onKeyDown={(e) => e.key === 'Enter' && commitPriceMin()}
                        className={styles.rangeInput}
                    />
                    <span className={styles.rangeDash}>–</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="до"
                        value={rangeDraft.priceMax}
                        onChange={(e) => setRangeDraft((d) => ({ ...d, priceMax: e.target.value }))}
                        onBlur={commitPriceMax}
                        onKeyDown={(e) => e.key === 'Enter' && commitPriceMax()}
                        className={styles.rangeInput}
                    />
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Площадь, м²</div>
                <div className={styles.rangeRow}>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="от"
                        value={rangeDraft.areaMin}
                        onChange={(e) => setRangeDraft((d) => ({ ...d, areaMin: e.target.value }))}
                        onBlur={commitAreaMin}
                        onKeyDown={(e) => e.key === 'Enter' && commitAreaMin()}
                        className={styles.rangeInput}
                    />
                    <span className={styles.rangeDash}>–</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="до"
                        value={rangeDraft.areaMax}
                        onChange={(e) => setRangeDraft((d) => ({ ...d, areaMax: e.target.value }))}
                        onBlur={commitAreaMax}
                        onKeyDown={(e) => e.key === 'Enter' && commitAreaMax()}
                        className={styles.rangeInput}
                    />
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Город</div>
                <CitySelect
                    value={value.city}
                    onChange={handleCity}
                    cities={cities}
                />
            </div>

            <button type="button" className={styles.resetButton} onClick={reset}>
                Сбросить фильтры
            </button>
        </aside>
    );
};
