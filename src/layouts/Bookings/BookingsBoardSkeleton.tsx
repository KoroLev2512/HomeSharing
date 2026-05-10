"use client";

import React from "react";
import classNames from "classnames";
import layoutStyles from "./styles.module.scss";
import skel from "./bookingsSkeleton.module.scss";

const GuestBookingCardSkeleton: React.FC = () => (
    <article className={layoutStyles.card} aria-hidden>
        <div className={classNames(layoutStyles.cover, skel.shimmer)} />
        <div className={layoutStyles.body}>
            <div className={layoutStyles.cardHead}>
                <div className={classNames(skel.line, skel.titleLine, skel.shimmer)} />
                <div className={classNames(skel.line, skel.badge, skel.shimmer)} />
            </div>
            <div className={classNames(skel.line, skel.address, skel.shimmer)} />
            <div className={layoutStyles.meta}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={layoutStyles.metaItem}>
                        <div className={classNames(skel.line, skel.metaLabel, skel.shimmer)} />
                        <div className={classNames(skel.line, skel.metaValue, skel.shimmer)} />
                    </div>
                ))}
            </div>
            <div className={layoutStyles.actions}>
                <div className={classNames(skel.line, skel.btn, skel.shimmer)} />
                <div className={classNames(skel.line, skel.btn, skel.btnDanger, skel.shimmer)} />
            </div>
        </div>
    </article>
);

export const BookingsBoardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className={layoutStyles.root}>
        <header className={layoutStyles.header}>
            <h1 className={layoutStyles.title}>Мои бронирования</h1>
            <div className={classNames(skel.line, skel.headerStatus, skel.shimmer)} aria-hidden />
        </header>
        <div className={layoutStyles.list}>
            {Array.from({ length: count }).map((_, i) => (
                <GuestBookingCardSkeleton key={i} />
            ))}
        </div>
    </div>
);
