"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import styles from "./styles.module.scss";

declare global {
    interface Window {
        ymaps?: {
            ready: (cb: () => void) => void;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Map: new (el: HTMLElement, state: Record<string, unknown>, options?: Record<string, unknown>) => any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Placemark: new (geometry: number[], props?: Record<string, unknown>, options?: Record<string, unknown>) => any;
            geocode: (query: string, options?: unknown) => Promise<unknown>;
        };
    }
}

export interface YandexMapPickerValue {
    latitude: number;
    longitude: number;
}

interface IProps {
    apiKey: string;
    value: YandexMapPickerValue | null;
    onChange: (latitude: number, longitude: number) => void;
    onClear: () => void;
    /** Строка для геокодера (город, адрес и т.д.) */
    geocodeQuery?: string;
}

const DEFAULT_CENTER: [number, number] = [59.9343, 30.3351];
/** Без метки — ближе к городу, чтобы проще кликать по дому. */
const DEFAULT_ZOOM = 12;
const POINT_ZOOM = 17;

let ymapsScriptPromise: Promise<void> | null = null;

function ensureYmaps(apiKey: string): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();

    if (window.ymaps) {
        return new Promise((resolve) => {
            window.ymaps!.ready(() => resolve());
        });
    }

    if (!ymapsScriptPromise) {
        ymapsScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>("script[data-homesharing-yandex-maps]");
            if (existing) {
                existing.addEventListener("load", () => window.ymaps!.ready(() => resolve()));
                existing.addEventListener("error", () => reject(new Error("Yandex Maps script error")));
                return;
            }
            const s = document.createElement("script");
            s.dataset.homesharingYandexMaps = "true";
            s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
            s.async = true;
            s.onload = () => {
                window.ymaps!.ready(() => resolve());
            };
            s.onerror = () => reject(new Error("Yandex Maps script error"));
            document.head.appendChild(s);
        });
    }

    return ymapsScriptPromise;
}

export const YandexMapPicker: React.FC<IProps> = ({ apiKey, value, onChange, onClear, geocodeQuery }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API Яндекс.Карт без типов в проекте
    const mapRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const placemarkRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const [loadError, setLoadError] = useState<string | null>(null);
    const [geocodeError, setGeocodeError] = useState<string | null>(null);
    const [geocoding, setGeocoding] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const ensurePlacemark = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ymaps: any, map: any, coords: [number, number]) => {
            if (placemarkRef.current) {
                placemarkRef.current.geometry.setCoordinates(coords);
            } else {
                const pm = new ymaps.Placemark(
                    coords,
                    {},
                    { draggable: true, preset: "islands#blueDotIcon" },
                );
                pm.events.add("dragend", () => {
                    const c = pm.geometry.getCoordinates();
                    onChangeRef.current(c[0], c[1]);
                });
                map.geoObjects.add(pm);
                placemarkRef.current = pm;
            }
        },
        [],
    );

    useEffect(() => {
        if (!apiKey.trim() || !containerRef.current) return;

        let cancelled = false;

        ensureYmaps(apiKey)
            .then(() => {
                if (cancelled || !containerRef.current || !window.ymaps) return;
                const ymaps = window.ymaps;
                const center: [number, number] = value
                    ? [value.latitude, value.longitude]
                    : DEFAULT_CENTER;
                const zoom = value ? POINT_ZOOM : DEFAULT_ZOOM;

                const map = new ymaps.Map(containerRef.current, {
                    center,
                    zoom,
                    controls: ["zoomControl", "geolocationControl", "fullscreenControl"],
                });
                mapRef.current = map;

                if (value) {
                    ensurePlacemark(ymaps, map, [value.latitude, value.longitude]);
                }

                const placeAt = (coords: [number, number]) => {
                    ensurePlacemark(ymaps, map, coords);
                    onChangeRef.current(coords[0], coords[1]);
                };

                map.events.add("click", (e: { get: (k: string) => number[] }) => {
                    placeAt(e.get("coords") as [number, number]);
                });

                if (!cancelled) setMapReady(true);
            })
            .catch(() => {
                if (!cancelled) setLoadError("Не удалось загрузить Яндекс.Карты");
            });

        return () => {
            cancelled = true;
            setMapReady(false);
            placemarkRef.current = null;
            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- инициализация один раз на ключ
    }, [apiKey, ensurePlacemark]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !window.ymaps) return;
        const ymaps = window.ymaps;

        if (value) {
            const coords: [number, number] = [value.latitude, value.longitude];
            ensurePlacemark(ymaps, map, coords);
            map.setCenter(coords, POINT_ZOOM);
        } else {
            if (placemarkRef.current) {
                map.geoObjects.remove(placemarkRef.current);
                placemarkRef.current = null;
            }
            map.setCenter(DEFAULT_CENTER, DEFAULT_ZOOM);
        }
    }, [value, ensurePlacemark]);

    const handlePlaceCenter = () => {
        const map = mapRef.current;
        const ymaps = window.ymaps;
        if (!map || !ymaps) return;
        const c = map.getCenter() as [number, number];
        const coords: [number, number] = [c[0], c[1]];
        ensurePlacemark(ymaps, map, coords);
        onChange(coords[0], coords[1]);
    };

    const handleGeocode = () => {
        const q = geocodeQuery?.trim();
        if (!q || !window.ymaps || !mapRef.current) return;
        setGeocodeError(null);
        setGeocoding(true);
        window.ymaps
            .geocode(q, { results: 1 })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((res: any) => {
                const first = res.geoObjects.get(0);
                if (!first) {
                    setGeocodeError("Адрес не найден");
                    return;
                }
                const coords = first.geometry.getCoordinates() as [number, number];
                const map = mapRef.current;
                if (!map) return;
                ensurePlacemark(window.ymaps, map, coords);
                map.setCenter(coords, POINT_ZOOM);
                onChange(coords[0], coords[1]);
            })
            .catch(() => setGeocodeError("Ошибка поиска адреса"))
            .finally(() => setGeocoding(false));
    };

    if (!apiKey.trim()) {
        return (
            <p className={styles.fallback}>
                Чтобы выбрать точку на карте, добавьте в <code>.env</code> переменную{" "}
                <code>NEXT_PUBLIC_YANDEX_MAPS_API_KEY</code> (ключ JavaScript API 2.1 из кабинета Яндекса).
            </p>
        );
    }

    if (loadError) {
        return <p className={styles.fallback}>{loadError}</p>;
    }

    return (
        <div className={styles.root}>
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.mapBtn}
                    onClick={handleGeocode}
                    disabled={!geocodeQuery?.trim() || geocoding || !mapReady}
                >
                    {geocoding ? "Поиск…" : "Найти по адресу"}
                </button>
                <button
                    type="button"
                    className={classNames(styles.mapBtn, styles.mapBtnPrimary)}
                    onClick={handlePlaceCenter}
                    disabled={!mapReady}
                    title="Сначала сдвиньте карту так, чтобы нужное место оказалось в центре"
                >
                    Метка по центру карты
                </button>
                <button
                    type="button"
                    className={classNames(styles.mapBtn, styles.mapBtnSecondary)}
                    onClick={onClear}
                    disabled={!value}
                >
                    Сбросить точку
                </button>
                {value && (
                    <span className={styles.coords}>
                        {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                    </span>
                )}
            </div>
            {geocodeError && <p className={styles.hintError}>{geocodeError}</p>}
            <p className={styles.clickCue}>
                <strong>Клик по карте</strong> ставит метку в этом месте — это и есть точка объекта. Метку потом можно сдвинуть
                перетаскиванием.
            </p>
            <p className={styles.mapHint}>
                Альтернатива: сдвиньте карту и нажмите «Метка по центру карты». Сначала можно «Найти по адресу».
            </p>
            <div
                ref={containerRef}
                className={styles.mapBox}
                role="application"
                aria-label="Карта: клик по области задаёт координаты точки"
            />
        </div>
    );
};
