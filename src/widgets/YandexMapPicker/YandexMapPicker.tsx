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
            suggest?: (query: string, options?: unknown) => Promise<IYmapsSuggestItem[]>;
        };
    }
}

interface IYmapsSuggestItem {
    displayName?: string;
    value?: string;
}

export interface YandexMapPickerValue {
    latitude: number;
    longitude: number;
}

interface IAddressSuggestion {
    id: string;
    title: string;
    subtitle: string;
    value: string;
}

interface IAddressSearchResult {
    id: string;
    title: string;
    subtitle: string;
    coords: [number, number];
    components: Array<{ kind: string; name: string }>;
}

export interface IResolvedAddress {
    city: string;
    address: string;
}

interface IProps {
    apiKey: string;
    value: YandexMapPickerValue | null;
    onChange: (latitude: number, longitude: number) => void;
    onClear: () => void;
    onAddressResolved?: (info: IResolvedAddress) => void;
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

export const YandexMapPicker: React.FC<IProps> = ({ apiKey, value, onChange, onClear, onAddressResolved, geocodeQuery }) => {
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
    const [addressQuery, setAddressQuery] = useState(geocodeQuery ?? "");
    const [searchResults, setSearchResults] = useState<IAddressSearchResult[]>([]);
    const [searchTouched, setSearchTouched] = useState(false);
    const [suggestions, setSuggestions] = useState<IAddressSuggestion[]>([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
    const [searchFocused, setSearchFocused] = useState(false);

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

    useEffect(() => {
        if (searchTouched) return;
        setAddressQuery(geocodeQuery ?? "");
    }, [geocodeQuery, searchTouched]);

    useEffect(() => {
        const query = addressQuery.trim();
        const suggest = window.ymaps?.suggest;

        if (!searchFocused || !mapReady || !suggest || query.length < 3) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            setSuggestLoading(false);
            setHighlightedSuggestion(-1);
            return;
        }

        let cancelled = false;
        setSuggestLoading(true);

        const timer = window.setTimeout(() => {
            suggest(query, { results: 7 })
                .then((items) => {
                    if (cancelled) return;

                    const next = items
                        .map((item, index) => {
                            const value = String(item.value ?? item.displayName ?? "").trim();
                            const displayName = String(item.displayName ?? value).trim();
                            const [title, ...rest] = displayName.split(", ");

                            return {
                                id: `${value}-${index}`,
                                title: title || value,
                                subtitle: rest.join(", "),
                                value,
                            };
                        })
                        .filter((item) => item.value.length > 0);

                    setSuggestions(next);
                    setSuggestionsOpen(next.length > 0);
                    setHighlightedSuggestion(next.length > 0 ? 0 : -1);
                    setSuggestLoading(false);
                }, () => {
                    if (!cancelled) {
                        setSuggestions([]);
                        setSuggestionsOpen(false);
                        setHighlightedSuggestion(-1);
                        setSuggestLoading(false);
                    }
                });
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [addressQuery, mapReady, searchFocused]);

    const applyPoint = (coords: [number, number]) => {
        const map = mapRef.current;
        const ymaps = window.ymaps;
        if (!map || !ymaps) return;
        ensurePlacemark(ymaps, map, coords);
        map.setCenter(coords, POINT_ZOOM);
        onChange(coords[0], coords[1]);
    };

    const handlePlaceCenter = () => {
        const map = mapRef.current;
        const ymaps = window.ymaps;
        if (!map || !ymaps) return;
        const c = map.getCenter() as [number, number];
        const coords: [number, number] = [c[0], c[1]];
        ensurePlacemark(ymaps, map, coords);
        onChange(coords[0], coords[1]);
    };

    const geocodeAddress = (query: string) => {
        const q = query.trim();
        if (!q || !window.ymaps || !mapRef.current) return;
        setGeocodeError(null);
        setSuggestionsOpen(false);
        setSearchResults([]);
        setGeocoding(true);
        window.ymaps
            .geocode(q, { results: 5 })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((res: any) => {
                const found: IAddressSearchResult[] = [];
                res.geoObjects.each((geoObject: any, index: number) => {
                    const coords = geoObject.geometry.getCoordinates() as [number, number];
                    const title = String(geoObject.properties.get("name") ?? "Найденный адрес");
                    const subtitle = String(
                        geoObject.properties.get("description") ??
                        geoObject.properties.get("text") ??
                        "",
                    );
                    const meta = geoObject.properties.get("metaDataProperty.GeocoderMetaData");
                    const components: Array<{ kind: string; name: string }> =
                        meta?.Address?.Components ?? [];
                    found.push({
                        id: `${coords[0]}-${coords[1]}-${index}`,
                        title,
                        subtitle,
                        coords,
                        components,
                    });
                });

                if (found.length === 0) {
                    setGeocodeError("Адрес не найден");
                    setGeocoding(false);
                    return;
                }

                setSearchResults(found);
                applyPoint(found[0]!.coords);

                if (onAddressResolved && found[0]) {
                    const { components } = found[0];
                    const city =
                        components.find((c) => c.kind === "locality")?.name ||
                        components.find((c) => c.kind === "province")?.name ||
                        "";
                    const street = components.find((c) => c.kind === "street")?.name ?? "";
                    const house = components.find((c) => c.kind === "house")?.name ?? "";
                    const address = [street, house].filter(Boolean).join(", ");
                    onAddressResolved({ city, address });
                }

                setGeocoding(false);
            }, () => {
                setGeocodeError("Ошибка поиска адреса");
                setGeocoding(false);
            });
    };

    const handleAddressSearch = () => {
        geocodeAddress(addressQuery);
    };

    const handleSuggestionSelect = (suggestion: IAddressSuggestion) => {
        setSearchTouched(true);
        setAddressQuery(suggestion.value);
        setSuggestionsOpen(false);
        setSuggestions([]);
        setHighlightedSuggestion(-1);
        geocodeAddress(suggestion.value);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (suggestionsOpen && suggestions.length > 0 && highlightedSuggestion >= 0) {
                handleSuggestionSelect(suggestions[highlightedSuggestion]!);
                return;
            }
            handleAddressSearch();
            return;
        }

        if (e.key === "Escape") {
            setSuggestionsOpen(false);
            setHighlightedSuggestion(-1);
            return;
        }

        if (!suggestionsOpen || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedSuggestion((current) => (current + 1) % suggestions.length);
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedSuggestion((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
        }
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
            <div
                className={styles.searchPanel}
            >
                <label className={styles.searchLabel}>
                    <span>Поиск на карте</span>
                    <div className={styles.searchRow}>
                        <input
                            className={styles.searchInput}
                            value={addressQuery}
                            onChange={(e) => {
                                setSearchTouched(true);
                                setAddressQuery(e.target.value);
                                setSearchResults([]);
                                setGeocodeError(null);
                            }}
                            onFocus={() => {
                                setSearchFocused(true);
                                if (suggestions.length > 0) setSuggestionsOpen(true);
                            }}
                            onBlur={() => {
                                window.setTimeout(() => {
                                    setSearchFocused(false);
                                    setSuggestionsOpen(false);
                                }, 120);
                            }}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Например: Санкт-Петербург, Невский проспект, 28"
                            autoComplete="off"
                            disabled={!mapReady || geocoding}
                        />
                        <button
                            type="button"
                            className={styles.mapBtn}
                            onClick={handleAddressSearch}
                            disabled={!addressQuery.trim() || geocoding || !mapReady}
                        >
                            {geocoding ? "Ищем…" : "Найти"}
                        </button>
                    </div>
                </label>
                {(suggestionsOpen || suggestLoading) && (
                    <div className={styles.searchResults} role="listbox" aria-label="Подсказки адресов">
                        {suggestLoading && suggestions.length === 0 ? (
                            <div className={styles.searchStatus}>Ищем адреса…</div>
                        ) : (
                            suggestions.map((suggestion, index) => (
                                <button
                                    key={suggestion.id}
                                    type="button"
                                    role="option"
                                    aria-selected={index === highlightedSuggestion}
                                    className={classNames(styles.searchResult, {
                                        [styles.searchResultActive]: index === highlightedSuggestion,
                                    })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                >
                                    <span className={styles.searchResultTitle}>{suggestion.title}</span>
                                    {suggestion.subtitle && (
                                        <span className={styles.searchResultSubtitle}>{suggestion.subtitle}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}
                {searchResults.length > 0 && (
                    <div className={styles.searchResults} aria-label="Найденные адреса">
                        {searchResults.map((result) => (
                            <button
                                key={result.id}
                                type="button"
                                className={styles.searchResult}
                                onClick={() => applyPoint(result.coords)}
                            >
                                <span className={styles.searchResultTitle}>{result.title}</span>
                                {result.subtitle && (
                                    <span className={styles.searchResultSubtitle}>{result.subtitle}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className={styles.toolbar}>
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
