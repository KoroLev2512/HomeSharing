'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './guestAccess.module.scss';

interface AccessPolicy {
    id: string;
    booking_id: string;
    listing_id: string;
    guest_user_id: string;
    access_code: string;
    valid_from: string;
    valid_until: string;
    scope: string;
    status: string;
    iot_device?: { name: string; device_type: string; vendor?: string } | null;
}

function formatDateTime(iso: string): string {
    try {
        return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
}

function isActive(policy: AccessPolicy): boolean {
    const now = Date.now();
    return policy.status === 'active' &&
        new Date(policy.valid_from).getTime() <= now &&
        new Date(policy.valid_until).getTime() >= now;
}

/** Генерирует mock-QR SVG на основе кода доступа */
function QRCodeMock({ code }: { code: string }) {
    // Визуальный mock QR: случайный паттерн пикселей на основе хэша кода
    const size = 11;
    const seed = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const cells: boolean[][] = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => {
            // Угловые маркеры всегда заполнены (имитация finder patterns)
            if ((r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3)) return true;
            return ((seed * (r + 1) * (c + 1)) % 7) > 2;
        })
    );

    const cell = 24;
    const padding = 16;
    const svgSize = size * cell + padding * 2;

    return (
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} xmlns="http://www.w3.org/2000/svg">
            <rect width={svgSize} height={svgSize} fill="#fff"/>
            {cells.map((row, r) =>
                row.map((filled, c) =>
                    filled ? (
                        <rect
                            key={`${r}-${c}`}
                            x={padding + c * cell}
                            y={padding + r * cell}
                            width={cell - 1}
                            height={cell - 1}
                            rx={1}
                            fill="#1a1a1a"
                        />
                    ) : null
                )
            )}
        </svg>
    );
}

export function GuestAccessPage({ bookingId }: { bookingId: string }) {
    const [policies, setPolicies] = useState<AccessPolicy[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/access')
            .then((r) => r.json())
            .then((d: { policies?: AccessPolicy[] }) => {
                const filtered = (d.policies ?? []).filter((p) => p.booking_id === bookingId);
                setPolicies(filtered);
            })
            .catch(() => setError('Не удалось загрузить данные доступа'));
    }, [bookingId]);

    const activePolicies = policies?.filter(isActive) ?? [];
    const expiredPolicies = policies?.filter((p) => !isActive(p)) ?? [];

    return (
        <div className={styles.root}>
            <div className={styles.container}>
                <Link href="/bookings" className={styles.back}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Мои бронирования
                </Link>

                <h1 className={styles.title}>Цифровой доступ</h1>
                <p className={styles.subtitle}>
                    Ваши ключи доступа к объекту. Предъявите QR-код при входе. (§4.3 диплома)
                </p>

                {error && <div className={styles.error}>{error}</div>}

                {!policies && !error && (
                    <div className={styles.loading}>Загрузка…</div>
                )}

                {policies && activePolicies.length === 0 && (
                    <div className={styles.empty}>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <rect width="48" height="48" rx="24" fill="#f3f3f3"/>
                            <path d="M32 22V20a8 8 0 0 0-16 0v2a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4v-8a4 4 0 0 0-4-4Zm-12-2a4 4 0 0 1 8 0v2h-8v-2Z" fill="#d6d6d6"/>
                        </svg>
                        <p>Цифровой доступ ещё не выдан.</p>
                        <p style={{ fontSize: '0.8125rem', color: '#9a9a9a' }}>Доступ активируется после подтверждения бронирования арендодателем.</p>
                    </div>
                )}

                {activePolicies.map((p) => (
                    <div key={p.id} className={styles.keyCard}>
                        <div className={styles.keyHeader}>
                            <div className={styles.keyDevice}>
                                🔐 {p.iot_device?.name ?? 'Цифровой ключ'}
                                {p.iot_device?.device_type && (
                                    <span className={styles.deviceType}>{p.iot_device.device_type}</span>
                                )}
                            </div>
                            <span className={styles.statusActive}>Активен</span>
                        </div>

                        <div className={styles.qrWrapper}>
                            <QRCodeMock code={p.access_code} />
                        </div>

                        <div className={styles.codeBlock}>
                            <span className={styles.codeLabel}>Код доступа</span>
                            <code className={styles.code}>
                                {p.access_code.match(/.{1,4}/g)?.join(' ') ?? p.access_code}
                            </code>
                        </div>

                        <div className={styles.validity}>
                            <div className={styles.validityRow}>
                                <span>Действует с</span>
                                <strong>{formatDateTime(p.valid_from)}</strong>
                            </div>
                            <div className={styles.validityRow}>
                                <span>Действует до</span>
                                <strong>{formatDateTime(p.valid_until)}</strong>
                            </div>
                            <div className={styles.validityRow}>
                                <span>Тип доступа</span>
                                <strong>{p.scope === 'guest' ? 'Гость' : p.scope}</strong>
                            </div>
                        </div>

                        <p className={styles.hint}>
                            Поднесите QR-код к считывателю у входа или введите код вручную на панели устройства.
                        </p>
                    </div>
                ))}

                {expiredPolicies.length > 0 && (
                    <details className={styles.expired}>
                        <summary>История доступа ({expiredPolicies.length})</summary>
                        {expiredPolicies.map((p) => (
                            <div key={p.id} className={styles.expiredItem}>
                                <span>{p.iot_device?.name ?? 'Ключ'}</span>
                                <span className={p.status === 'revoked' ? styles.statusRevoked : styles.statusExpired}>
                                    {p.status === 'revoked' ? 'Отозван' : 'Истёк'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#9a9a9a' }}>до {formatDateTime(p.valid_until)}</span>
                            </div>
                        ))}
                    </details>
                )}
            </div>
        </div>
    );
}
