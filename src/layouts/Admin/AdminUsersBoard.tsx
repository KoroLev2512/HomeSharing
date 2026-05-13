"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AdminService, type AdminUserPatch } from '@/shared/lib/adminService';
import type { IAdminUser } from '@/shared/types/admin';
import { AdminUsersTableSkeleton } from '@/layouts/Admin/AdminBoardSkeletons';
import styles from './table.module.scss';

const adminUserDateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDate = (s: string) => {
    try {
        return adminUserDateFmt.format(new Date(s));
    } catch { return s; }
};

type RoleFilter = 'all' | 'admin' | 'host' | 'user';

const FILTERS: { value: RoleFilter; label: string }[] = [
    { value: 'all',   label: 'Все' },
    { value: 'admin', label: 'Администраторы' },
    { value: 'host',  label: 'Арендодатели' },
    { value: 'user',  label: 'Обычные пользователи' },
];

export const AdminUsersBoard: React.FC = () => {
    const [users, setUsers] = useState<IAdminUser[] | null>(null);
    const [filter, setFilter] = useState<RoleFilter>('all');
    const [error, setError] = useState<string | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);

    const load = useCallback(async (role: RoleFilter) => {
        try {
            setError(null);
            const data = await AdminService.listUsers(role === 'all' ? undefined : role);
            setUsers(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось загрузить пользователей');
        }
    }, []);

    useEffect(() => { void load(filter); }, [filter, load]);

    const patch = async (id: string, p: AdminUserPatch) => {
        setPendingId(id);
        try {
            const updated = await AdminService.updateUser(id, p);
            setUsers((prev) => prev?.map((u) => (u.id === id ? updated : u)) ?? null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось обновить пользователя');
        } finally {
            setPendingId(null);
        }
    };

    return (
        <div className={styles.root}>
            <div className={styles.toolbar}>
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        className={`${styles.filterBtn} ${filter === f.value ? styles.filterBtnActive : ''}`}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
                {users && <span className={styles.count}>{users.length} пользователей</span>}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {!users ? (
                <AdminUsersTableSkeleton />
            ) : users.length === 0 ? (
                <div className={styles.empty}>Пользователи не найдены</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead className={styles.thead}>
                            <tr>
                                <th>Пользователь</th>
                                <th>Роли</th>
                                <th>Зарегистрирован</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div className={styles.userCell}>
                                            {u.image ? (
                                                <Image src={u.image} alt="" width={32} height={32} className={styles.avatar} />
                                            ) : (
                                                <div className={styles.avatarFallback}>
                                                    {(u.name ?? u.email).slice(0, 1).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className={styles.userName}>{u.name ?? u.username ?? '—'}</div>
                                                <div className={styles.userEmail}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.rolesCell}>
                                            {u.isAdmin && <span className={`${styles.badge} ${styles.badgeAdmin}`}>Админ</span>}
                                            {u.isHost && <span className={`${styles.badge} ${styles.badgeHost}`}>Хост</span>}
                                            {u.isUser && <span className={`${styles.badge} ${styles.badgeUser}`}>Пользователь</span>}
                                        </div>
                                    </td>
                                    <td className={styles.td}>{formatDate(u.createdAt)}</td>
                                    <td className={styles.td}>
                                        <div className={styles.actionsCell}>
                                            <button
                                                type="button"
                                                disabled={pendingId === u.id}
                                                className={`${styles.actionBtn} ${u.isAdmin ? styles.actionBtnActive : ''}`}
                                                onClick={() => patch(u.id, { isAdmin: !u.isAdmin })}
                                            >
                                                {u.isAdmin ? 'Снять админа' : 'Сделать админом'}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={pendingId === u.id}
                                                className={`${styles.actionBtn} ${u.isHost ? styles.actionBtnActive : ''}`}
                                                onClick={() => patch(u.id, { isHost: !u.isHost })}
                                            >
                                                {u.isHost ? 'Снять хоста' : 'Сделать хостом'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
