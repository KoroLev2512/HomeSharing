'use client';

import React, { useEffect, useReducer, useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import styles from './hostVerify.module.scss';

// ── Types ────────────────────────────────────────────────────────────────────

interface InterpretationResult {
    status: string;
    reason: string;
    requiresManualReview: boolean;
}

interface RosreestrData {
    cn: string;
    address?: string;
    areaValue?: string;
    name?: string;
    purposeName?: string;
    statecd?: string;
    statecdLabel?: string;
    floors?: string;
    yearBuilt?: string;
    cadCost?: string;
}

interface CheckResult {
    found: boolean;
    cn: string;
    originalCn?: string;
    normalizationStatus?: string;
    data?: RosreestrData;
    layerName?: string;
    interpretation?: InterpretationResult;
    durationMs?: number;
}

type FormState = { cn: string; loading: boolean; result: CheckResult | null; error: string };

const INTERP_LABELS: Record<string, string> = {
    found:                  'Объект найден ✓',
    verified:               'Право подтверждено ✓',
    not_found:              'Объект не найден',
    not_verified:           'Не подтверждено',
    inconclusive:           'Неоднозначный результат',
    technical_failure:      'Технический сбой',
    manual_review_required: 'Требует ручной проверки',
};

const INTERP_TONE: Record<string, string> = {
    found:                  styles.toneSuccess,
    verified:               styles.toneSuccess,
    not_found:              styles.toneDanger,
    not_verified:           styles.toneDanger,
    inconclusive:           styles.toneInfo,
    technical_failure:      styles.toneDanger,
    manual_review_required: styles.toneMuted,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function HostVerifyPage({ listingId }: { listingId: string }) {
    const [state, setState] = useReducer(
        (s: FormState, patch: Partial<FormState>) => ({ ...s, ...patch }),
        { cn: '', loading: false, result: null, error: '' },
    );

    const [listingArea, setListingArea] = useState<number | undefined>();

    // Загружаем площадь объявления для сравнения
    useEffect(() => {
        fetch(`/api/host/listings/${listingId}`)
            .then((r) => r.json())
            .then((d: { listing?: { area?: number } }) => {
                if (d?.listing?.area) setListingArea(d.listing.area);
            })
            .catch(() => undefined);
    }, [listingId]);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.cn.trim()) return;
        setState({ loading: true, error: '', result: null });
        try {
            const res = await fetch('/api/admin/rosreestr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cadastralNumber: state.cn, listingArea, listingId }),
            });
            const data = await res.json() as CheckResult & { error?: string };
            if (!res.ok) {
                setState({ loading: false, error: data.error ?? 'Ошибка запроса к Росреестру' });
            } else {
                setState({ loading: false, result: data });
            }
        } catch {
            setState({ loading: false, error: 'Не удалось выполнить запрос' });
        }
    };

    const handleSave = async () => {
        if (!state.result) return;
        const rosreestrStatus = state.result.found ? 'found' : 'not_found';
        await fetch(`/api/admin/listings/${listingId}/verify`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cadastralNumber: state.result.cn,
                rosreestrStatus,
                rosreestrData: state.result.data ?? null,
            }),
        });
    };

    const interp = state.result?.interpretation;
    const cnValid = /^\d{2}:\d{2}:\d{6,7}:\d+$/.test(state.cn.trim()) ||
        /^\d{1,2}[:\s\-]\d{1,2}[:\s\-]\d{6,7}[:\s\-]\d+$/.test(state.cn.trim());

    return (
        <div className={styles.root}>
            <div className={styles.container}>
                {/* Назад */}
                <Link href={`/host/listings/${listingId}/edit`} className={styles.back}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Назад к редактированию
                </Link>

                <h1 className={styles.title}>Верификация права собственности</h1>
                <p className={styles.subtitle}>
                    Введите кадастровый номер объекта — платформа автоматически запросит данные Росреестра
                    и определит статус верификации. (§4.2 диплома)
                </p>

                {/* Форма */}
                <form onSubmit={handleCheck} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="cn">Кадастровый номер</label>
                        <div className={styles.inputRow}>
                            <input
                                id="cn"
                                className={classNames(styles.input, !cnValid && state.cn ? styles.inputError : undefined)}
                                value={state.cn}
                                onChange={(e) => setState({ cn: e.target.value, result: null, error: '' })}
                                placeholder="77:01:0001001:1234"
                                disabled={state.loading}
                            />
                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={!state.cn.trim() || state.loading}
                            >
                                {state.loading ? 'Запрос...' : 'Проверить'}
                            </button>
                        </div>
                        {!cnValid && state.cn && (
                            <p className={styles.hint}>Формат: NN:NN:NNNNNNN:NNN (допустимы пробелы и тире)</p>
                        )}
                        {listingArea && (
                            <p className={styles.areaHint}>Площадь объявления для сравнения: {listingArea} м²</p>
                        )}
                    </div>
                </form>

                {state.error && <div className={styles.error}>{state.error}</div>}

                {/* Результат */}
                {state.result && (
                    <div className={styles.result}>
                        {/* Нормализация */}
                        {state.result.originalCn && (
                            <div className={styles.normBadge}>
                                Номер нормализован: <code>{state.result.originalCn}</code> → <code>{state.result.cn}</code>
                            </div>
                        )}

                        {/* Интерпретация (§4.2 Interpretation Engine) */}
                        {interp && (
                            <div className={classNames(styles.interpBadge, INTERP_TONE[interp.status] ?? styles.toneMuted)}>
                                <strong>{INTERP_LABELS[interp.status] ?? interp.status}</strong>
                                <span>{interp.reason}</span>
                                {interp.requiresManualReview && (
                                    <span className={styles.manualReview}>⚠ Рекомендуется ручная проверка</span>
                                )}
                            </div>
                        )}

                        {/* Данные объекта */}
                        {state.result.data && (
                            <div className={styles.dataCard}>
                                <h3 className={styles.dataTitle}>
                                    {state.result.layerName ?? 'Объект'} · {state.result.data.cn}
                                </h3>
                                <dl className={styles.dl}>
                                    {state.result.data.address && (
                                        <><dt>Адрес</dt><dd>{state.result.data.address}</dd></>
                                    )}
                                    {state.result.data.name && (
                                        <><dt>Наименование</dt><dd>{state.result.data.name}</dd></>
                                    )}
                                    {state.result.data.areaValue && (
                                        <><dt>Площадь</dt><dd>{parseFloat(state.result.data.areaValue).toFixed(1)} м²</dd></>
                                    )}
                                    {state.result.data.statecdLabel && (
                                        <><dt>Статус</dt><dd>{state.result.data.statecdLabel}</dd></>
                                    )}
                                    {state.result.data.floors && (
                                        <><dt>Этажей</dt><dd>{state.result.data.floors}</dd></>
                                    )}
                                    {state.result.data.yearBuilt && (
                                        <><dt>Год постройки</dt><dd>{state.result.data.yearBuilt}</dd></>
                                    )}
                                </dl>
                                {state.result.durationMs && (
                                    <p className={styles.duration}>Время запроса: {state.result.durationMs} мс</p>
                                )}
                            </div>
                        )}

                        <button type="button" className={styles.saveBtn} onClick={handleSave}>
                            Сохранить результат в объявлении
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
