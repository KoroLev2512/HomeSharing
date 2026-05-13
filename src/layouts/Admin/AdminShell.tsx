"use client";

import React, { useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import classNames from 'classnames';
import { useSession } from 'next-auth/react';
import { AdminShellSessionSkeleton, type AdminShellSkeletonVariant } from '@/layouts/Admin/AdminBoardSkeletons';
import styles from './shell.module.scss';

interface IProps {
    children: React.ReactNode;
}

const TABS = [
    { href: '/admin/users', label: 'Пользователи' },
    { href: '/admin/listings', label: 'Объявления' },
    { href: '/admin/bookings', label: 'Бронирования' },
];

const shellSkeletonVariant = (pathname: string | null): AdminShellSkeletonVariant => {
    if (pathname?.startsWith('/admin/bookings')) return 'bookings';
    if (pathname?.startsWith('/admin/listings')) return 'listings';
    return 'users';
};

export const AdminShell: React.FC<IProps> = ({ children }) => {
    const pathname = usePathname();
    const { replace } = useRouter();
    const { data: session, status } = useSession();

    useLayoutEffect(() => {
        if (status === 'unauthenticated') replace('/login');
    }, [status, replace]);

    if (status === 'loading') {
        return <AdminShellSessionSkeleton variant={shellSkeletonVariant(pathname)} />;
    }
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
                <div className={styles.heroLeft}>
                    <h1 className={styles.title}>Панель администратора</h1>
                </div>
                <div className={styles.heroActions}>
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
                </div>
            </header>
            <main className={styles.body}>{children}</main>
        </div>
    );
};
