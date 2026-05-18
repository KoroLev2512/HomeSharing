'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import styles from './error-page.module.scss';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        console.error('[app/error]', error);
    }, [error]);

    return (
        <div className={styles.root}>
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

                <h1 className={styles.title}>Что-то пошло не так</h1>
                <p className={styles.description}>
                    Произошла непредвиденная ошибка. Попробуйте повторить действие
                    или вернитесь на главную страницу.
                </p>

                {error.digest && (
                    <span className={styles.digest}>
                        {error.digest}
                    </span>
                )}

                <div className={styles.actions}>
                    <button className={styles.primaryBtn} onClick={reset}>
                        Попробовать снова
                    </button>
                    <Link href="/listings" className={styles.secondaryBtn}>
                        На главную
                    </Link>
                </div>
            </div>
        </div>
    );
}
