"use client";

import React from "react";
import classNames from "classnames";
import shellStyles from "./shell.module.scss";
import tableStyles from "./table.module.scss";
import skel from "./adminSkeleton.module.scss";

export type AdminShellSkeletonVariant = "users" | "listings" | "bookings";

const USERS_FILTER_WIDTHS = ["narrow", "mid", "mid", "wide"] as const;
const LISTINGS_FILTER_WIDTHS = ["narrow", "wide", "wide", "mid"] as const;
const BOOKINGS_FILTER_WIDTHS = ["narrow", "mid", "wide", "mid", "mid", "mid"] as const;

type PillW = "narrow" | "mid" | "wide";

const pillClass = (w: PillW) => {
    if (w === "wide") return classNames(skel.filterPill, skel.filterPillWide, skel.shimmer);
    if (w === "narrow") return classNames(skel.filterPill, skel.filterPillNarrow, skel.shimmer);
    return classNames(skel.filterPill, skel.shimmer);
};

export const AdminUsersTableSkeleton: React.FC = () => (
    <div style={{ overflowX: "auto" }}>
        <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
                <tr>
                    <th>Пользователь</th>
                    <th>Роли</th>
                    <th>Зарегистрирован</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className={tableStyles.tr}>
                        <td className={tableStyles.td}>
                            <div className={tableStyles.userCell}>
                                <div className={classNames(tableStyles.avatarFallback, skel.shimmer)} />
                                <div>
                                    <div className={classNames(skel.line, skel.userName, skel.shimmer)} />
                                    <div className={classNames(skel.line, skel.userEmail, skel.shimmer)} />
                                </div>
                            </div>
                        </td>
                        <td className={tableStyles.td}>
                            <div className={tableStyles.rolesCell}>
                                <div className={classNames(skel.line, skel.rolePill, skel.shimmer)} />
                                <div className={classNames(skel.line, skel.rolePill, skel.shimmer)} />
                            </div>
                        </td>
                        <td className={tableStyles.td}>
                            <div className={classNames(skel.line, skel.dateCell, skel.shimmer)} />
                        </td>
                        <td className={tableStyles.td}>
                            <div className={tableStyles.actionsCell}>
                                <div className={classNames(skel.line, skel.actionSm, skel.shimmer)} />
                                <div className={classNames(skel.line, skel.actionSm, skel.shimmer)} />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const AdminCardSkeleton: React.FC = () => (
    <div className={tableStyles.card} aria-hidden>
        <div className={classNames(tableStyles.cover, skel.shimmer)} />
        <div className={tableStyles.body}>
            <div className={tableStyles.cardHead}>
                <div className={classNames(skel.line, skel.cardTitle, skel.shimmer)} />
                <div className={classNames(skel.line, skel.badge, skel.shimmer)} />
            </div>
            <div className={classNames(skel.line, skel.metaFull, skel.shimmer)} />
            <div className={tableStyles.metaRow}>
                <div className={classNames(skel.line, skel.metaShort, skel.shimmer)} />
                <div className={classNames(skel.line, skel.metaShort, skel.shimmer)} />
                <div className={classNames(skel.line, skel.metaShort, skel.shimmer)} />
            </div>
            <div className={tableStyles.cardActions}>
                <div className={classNames(skel.line, skel.actionBtn, skel.actionBtnWide, skel.shimmer)} />
                <div className={classNames(skel.line, skel.actionBtn, skel.shimmer)} />
            </div>
        </div>
    </div>
);

export const AdminCardsSkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => (
    <div className={tableStyles.list}>
        {Array.from({ length: count }).map((_, i) => (
            <AdminCardSkeleton key={i} />
        ))}
    </div>
);

const AdminToolbarSkeleton: React.FC<{ variant: AdminShellSkeletonVariant }> = ({ variant }) => {
    const widths =
        variant === "users"
            ? USERS_FILTER_WIDTHS
            : variant === "listings"
              ? LISTINGS_FILTER_WIDTHS
              : BOOKINGS_FILTER_WIDTHS;
    return (
        <div className={tableStyles.toolbar}>
            {widths.map((w, i) => (
                <div key={i} className={pillClass(w)} aria-hidden />
            ))}
            <div className={classNames(skel.line, skel.toolbarCount, skel.shimmer)} aria-hidden />
        </div>
    );
};

export const AdminShellSessionSkeleton: React.FC<{ variant: AdminShellSkeletonVariant }> = ({ variant }) => (
    <div className={shellStyles.root}>
        <header className={shellStyles.header}>
            <div className={shellStyles.heroLeft}>
                <div className={classNames(skel.shellTitle, skel.shimmer)} aria-hidden />
            </div>
            <div className={shellStyles.heroActions}>
                <div className={skel.shellTabs}>
                    <div className={classNames(skel.shellTab, skel.shellTabMid, skel.shimmer)} aria-hidden />
                    <div className={classNames(skel.shellTab, skel.shellTabWide, skel.shimmer)} aria-hidden />
                    <div className={classNames(skel.shellTab, skel.shellTabMid, skel.shimmer)} aria-hidden />
                </div>
            </div>
        </header>
        <main className={shellStyles.body}>
            <AdminToolbarSkeleton variant={variant} />
            {variant === "users" ? <AdminUsersTableSkeleton /> : <AdminCardsSkeletonList />}
        </main>
    </div>
);
