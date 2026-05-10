"use client";

import React from "react";
import Link from "next/link";
import classNames from "classnames";
import layoutStyles from "./styles.module.scss";
import skel from "./notificationsSkeleton.module.scss";

const NotificationCardSkeleton: React.FC = () => (
    <article className={layoutStyles.card} aria-hidden>
        <div className={layoutStyles.cardHead}>
            <div className={classNames(skel.line, skel.titleLine, skel.shimmer)} />
            <div className={classNames(skel.line, skel.dateLine, skel.shimmer)} />
        </div>
        <div className={classNames(skel.line, skel.textLine, skel.shimmer)} />
        <div className={classNames(skel.line, skel.textLineShort, skel.shimmer)} />
        <div className={classNames(skel.line, skel.badge, skel.shimmer)} />
    </article>
);

export const NotificationsBoardSkeleton: React.FC<{ count?: number; embedded?: boolean }> = ({
    count = 5,
    embedded = false,
}) => {
    const list = (
        <div className={layoutStyles.list}>
            {Array.from({ length: count }).map((_, i) => (
                <NotificationCardSkeleton key={i} />
            ))}
        </div>
    );

    if (embedded) {
        return list;
    }

    return (
        <div className={layoutStyles.root}>
            <header className={layoutStyles.header}>
                <div>
                    <h1 className={layoutStyles.title}>Уведомления</h1>
                </div>
                <div className={layoutStyles.headerActions}>
                    <Link href="/messages" className={layoutStyles.secondaryBtn}>
                        Сообщения
                    </Link>
                    <Link href="/favorites" className={layoutStyles.secondaryBtn}>
                        Избранное
                    </Link>
                </div>
            </header>

            {list}
        </div>
    );
};
