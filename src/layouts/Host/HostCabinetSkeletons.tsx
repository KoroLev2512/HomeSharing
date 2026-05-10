"use client";

import React from "react";
import classNames from "classnames";
import shellStyles from "./shell.module.scss";
import styles from "./hostCabinetSkeletons.module.scss";

export type HostCabinetSkeletonVariant = "listings" | "bookings";

export const HostShellSessionSkeleton: React.FC<{ variant: HostCabinetSkeletonVariant }> = ({ variant }) => (
    <div className={shellStyles.root}>
        <header className={shellStyles.header}>
            <div className={shellStyles.heroLeft}>
                <div className={classNames(styles.shellTitle, styles.shimmer)} aria-hidden />
            </div>
            <div className={shellStyles.heroActions}>
                <div className={styles.shellTabs}>
                    <div className={classNames(styles.shellTab, styles.shellTabNarrow, styles.shimmer)} aria-hidden />
                    <div className={classNames(styles.shellTab, styles.shimmer)} aria-hidden />
                </div>
            </div>
        </header>
        <main className={shellStyles.body}>
            {variant === "bookings" ? <HostBookingsSkeletonList count={3} /> : <HostListingsSkeletonList count={3} />}
        </main>
    </div>
);

const HostListingCardSkeleton: React.FC = () => (
    <div className={styles.listingCard} aria-hidden>
        <div className={classNames(styles.listingCover, styles.shimmer)} />
        <div className={styles.listingBody}>
            <div className={styles.listingHead}>
                <div className={classNames(styles.line, styles.listingTitleLine, styles.shimmer)} />
                <div className={classNames(styles.line, styles.listingBadge, styles.shimmer)} />
            </div>
            <div className={classNames(styles.line, styles.listingAddress, styles.shimmer)} />
            <div className={styles.listingMeta}>
                <div className={classNames(styles.line, styles.listingMetaLeft, styles.shimmer)} />
                <div className={classNames(styles.line, styles.listingMetaRight, styles.shimmer)} />
            </div>
            <div className={styles.listingActions}>
                <div className={classNames(styles.line, styles.listingBtn, styles.shimmer)} />
                <div className={classNames(styles.line, styles.listingBtn, styles.shimmer)} />
                <div
                    className={classNames(styles.line, styles.listingBtn, styles.listingBtnNarrow, styles.shimmer)}
                />
            </div>
        </div>
    </div>
);

export const HostListingsSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className={styles.list}>
        {Array.from({ length: count }).map((_, i) => (
            <HostListingCardSkeleton key={i} />
        ))}
    </div>
);

export const HostListingsToolbarSkeleton: React.FC = () => (
    <div className={classNames(styles.line, styles.toolbarLine, styles.shimmer)} aria-hidden />
);

const HostBookingCardSkeleton: React.FC = () => (
    <div className={styles.bookingCard} aria-hidden>
        <div className={classNames(styles.bookingCover, styles.shimmer)} />
        <div className={styles.bookingBody}>
            <div className={styles.bookingHead}>
                <div className={classNames(styles.line, styles.bookingTitleLine, styles.shimmer)} />
                <div className={classNames(styles.line, styles.bookingBadge, styles.shimmer)} />
            </div>
            <div className={classNames(styles.line, styles.bookingAddress, styles.shimmer)} />
            <div className={styles.bookingMeta}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={classNames(styles.line, styles.bookingMetaCell, styles.shimmer)} />
                ))}
            </div>
            <div className={styles.bookingActions}>
                <div className={classNames(styles.line, styles.bookingBtn, styles.shimmer)} />
                <div className={classNames(styles.line, styles.bookingBtn, styles.shimmer)} />
            </div>
        </div>
    </div>
);

export const HostBookingsSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className={styles.list}>
        {Array.from({ length: count }).map((_, i) => (
            <HostBookingCardSkeleton key={i} />
        ))}
    </div>
);

export const HostBookingsSubtitleSkeleton: React.FC = () => (
    <div className={classNames(styles.line, styles.subtitleLine, styles.shimmer)} aria-hidden />
);
