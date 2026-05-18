'use client';

import React, { useEffect } from 'react';
import styles from './error-page.module.scss';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        console.error('[global-error]', error);
    }, [error]);

    return (
        <html lang="ru">
            <body>
                <div className={styles.globalRoot}>
                    <span className={styles.backdrop} aria-hidden>500</span>

                    <div className={styles.content}>
                        <div className={`${styles.iconWrap} ${styles.iconWrapWarning}`}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path
                                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                    stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round"
                                />
                                <line
                                    x1="12" y1="9" x2="12" y2="13"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                />
                                <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                        </div>

                        <h1 className={styles.title}>Критическая ошибка</h1>
                        <p className={styles.description}>
                            Приложение столкнулось с серьёзной ошибкой. Попробуйте
                            перезагрузить страницу или зайдите позже.
                        </p>

                        {error.digest && (
                            <span className={styles.digest}>
                                {error.digest}
                            </span>
                        )}

                        <div className={styles.actions}>
                            <button
                                className={styles.primaryBtn}
                                onClick={reset}
                                style={{ background: '#1e51a4' }}
                            >
                                Перезагрузить
                            </button>
                            <a
                                href="/listings"
                                className={styles.secondaryBtn}
                                style={{ border: '1.5px solid #d9d9d9' }}
                            >
                                На главную
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
