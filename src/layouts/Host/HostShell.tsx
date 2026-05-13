"use client";

import React, { useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import classNames from 'classnames';
import { useSession } from 'next-auth/react';
import { HostShellSessionSkeleton } from '@/layouts/Host/HostCabinetSkeletons';
import styles from './shell.module.scss';

interface IProps {
    children: React.ReactNode;
}

const TABS = [
    { href: '/host/listings', label: 'Мои объявления' },
    { href: '/host/bookings', label: 'Заявки на бронирование' },
];

export const HostShell: React.FC<IProps> = ({ children }) => {
    const pathname = usePathname();
    const { replace } = useRouter();
    const { data: session, status } = useSession();

    useLayoutEffect(() => {
        if (status === 'unauthenticated') {
            replace('/login');
        }
    }, [status, replace]);

    if (status === 'loading') {
        const variant = pathname?.startsWith('/host/bookings') ? 'bookings' : 'listings';
        return <HostShellSessionSkeleton variant={variant} />;
    }

    if (status !== 'authenticated' || !session?.user) {
        return null;
    }

    if (!session.user.isHost) {
        return (
            <div className={styles.root}>
                <div className={styles.gateBox}>
                    <h1 className={styles.gateTitle}>Только для арендодателей</h1>
                    <p className={styles.gateText}>
                        Чтобы размещать свои объявления и принимать бронирования, активируйте роль арендодателя
                        в настройках профиля.
                    </p>
                    <Link href="/settings" className={styles.primaryBtn}>
                        Перейти в настройки
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.root}>
            <header className={styles.header}>
                <div className={styles.heroLeft}>
                    <h1 className={styles.title}>Кабинет арендодателя</h1>
                </div>
                <div className={styles.heroActions}>
                    <nav className={styles.tabs}>
                        {TABS.map((t) => {
                            const isActive = pathname?.startsWith(t.href);
                            return (
                                <Link
                                    key={t.href}
                                    href={t.href}
                                    className={classNames(styles.tab, { [styles.tabActive]: isActive })}
                                >
                                    {t.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>
            <main className={styles.body}>{children}</main>
        </div>
    );
};
