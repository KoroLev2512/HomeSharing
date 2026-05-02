"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import classNames from 'classnames';
import { useSession } from 'next-auth/react';
import Loader from '@/shared/ui/Loader/Loader';
import styles from './shell.module.scss';

interface IProps {
    children: React.ReactNode;
}

const TABS = [
    { href: '/admin/users', label: 'Пользователи' },
    { href: '/admin/listings', label: 'Объявления' },
    { href: '/admin/bookings', label: 'Бронирования' },
];

export const AdminShell: React.FC<IProps> = ({ children }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated') router.replace('/login');
    }, [status, router]);

    if (status === 'loading') return <Loader />;
    if (status !== 'authenticated' || !session?.user) return null;

    if (!session.user.isAdmin) {
        return (
            <div className={styles.root}>
                <div className={styles.gateBox}>
                    <h1 className={styles.gateTitle}>Доступ запрещён</h1>
                    <p className={styles.gateText}>Эта страница доступна только администраторам.</p>
                    <Link href="/" className={styles.primaryBtn}>На главную</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.root}>
            <header className={styles.header}>
                <h1 className={styles.title}>Панель администратора</h1>
                <nav className={styles.tabs}>
                    {TABS.map((t) => (
                        <Link
                            key={t.href}
                            href={t.href}
                            className={classNames(styles.tab, { [styles.tabActive]: pathname?.startsWith(t.href) })}
                        >
                            {t.label}
                        </Link>
                    ))}
                </nav>
            </header>
            <main className={styles.body}>{children}</main>
        </div>
    );
};
