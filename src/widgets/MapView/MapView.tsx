"use client";

import React, { useEffect, useRef } from "react";
import styles from "./styles.module.scss";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YmapsInstance = any;

let ymapsScriptPromise: Promise<void> | null = null;

function getYmaps(): YmapsInstance | undefined {
    return typeof window !== "undefined" ? (window as YmapsInstance).ymaps : undefined;
}

function ensureYmaps(apiKey: string): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    if (getYmaps()) return new Promise((resolve) => getYmaps()!.ready(() => resolve()));

    if (!ymapsScriptPromise) {
        ymapsScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>("script[data-homesharing-yandex-maps]");
            if (existing) {
                existing.addEventListener("load", () => getYmaps()!.ready(() => resolve()));
                existing.addEventListener("error", () => reject());
                return;
            }
            const s = document.createElement("script");
            s.dataset.homesharingYandexMaps = "true";
            s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
            s.async = true;
            s.onload = () => getYmaps()!.ready(() => resolve());
            s.onerror = () => reject();
            document.head.appendChild(s);
        });
    }

    return ymapsScriptPromise;
}

interface IProps {
    apiKey: string;
    latitude: number;
    longitude: number;
    address?: string;
    zoom?: number;
}

export const MapView: React.FC<IProps> = ({ apiKey, latitude, longitude, address, zoom = 16 }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!apiKey.trim() || !containerRef.current) return;
        let cancelled = false;

        ensureYmaps(apiKey).then(() => {
            if (cancelled || !containerRef.current || !getYmaps()) return;
            const ymaps = getYmaps();

            const map = new ymaps.Map(containerRef.current, {
                center: [latitude, longitude],
                zoom,
                controls: ["zoomControl"],
            });

            const pin = new ymaps.Placemark(
                [latitude, longitude],
                { balloonContent: address ?? "" },
                { preset: "islands#redDotIcon" },
            );
            map.geoObjects.add(pin);
            map.behaviors.disable("scrollZoom");

            return () => { map.destroy(); };
        }).catch(() => {});

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, latitude, longitude]);

    if (!apiKey.trim()) return null;

    return (
        <div className={styles.root}>
            <div ref={containerRef} className={styles.map} />
        </div>
    );
};
