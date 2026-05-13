import React from 'react';
import classNames from 'classnames';
import styles from './detailSkeleton.module.scss';

export const ListingDetailSkeleton: React.FC = () => {
    return (
        <div className={styles.root} aria-hidden>
            <div className={styles.heroBar}>
                <div className={styles.heroBarInner}>
                    <div className={classNames(styles.heroTitle, styles.shimmer)} />
                    <div className={classNames(styles.heroBackButton, styles.shimmer)} />
                </div>
            </div>

            <div className={styles.headerBlock}>
                <div className={classNames(styles.badge, styles.shimmer)} />
                <div className={classNames(styles.title, styles.shimmer)} />
                <div className={classNames(styles.subtitle, styles.shimmer)} />
                <div className={classNames(styles.address, styles.shimmer)} />
            </div>

            <div className={styles.layout}>
                <div className={styles.leftColumn}>
                    <div className={classNames(styles.gallery, styles.shimmer)} />

                    <div className={styles.thumbStrip}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={classNames(styles.thumb, styles.shimmer)} />
                        ))}
                    </div>

                    <div className={styles.block}>
                        <div className={classNames(styles.blockTitle, styles.shimmer)} />
                        <div className={styles.specsGrid}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className={styles.specRow}>
                                    <div className={classNames(styles.specKey, styles.shimmer)} />
                                    <div className={classNames(styles.specValue, styles.shimmer)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.block}>
                        <div className={classNames(styles.blockTitle, styles.shimmer)} />
                        <div className={styles.chipsRow}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={classNames(styles.chip, styles.shimmer)} />
                            ))}
                        </div>
                    </div>

                    <div className={styles.block}>
                        <div className={classNames(styles.blockTitle, styles.shimmer)} />
                        <div className={classNames(styles.descriptionLine, styles.shimmer)} />
                        <div className={classNames(styles.descriptionLine, styles.shimmer)} />
                        <div className={classNames(styles.descriptionLine, styles.descriptionLineShort, styles.shimmer)} />
                    </div>
                </div>

                <aside className={styles.rightColumn}>
                    <div className={styles.priceBox}>
                        <div className={classNames(styles.price, styles.shimmer)} />
                        <div className={classNames(styles.rating, styles.shimmer)} />
                        <div className={classNames(styles.publishedAt, styles.shimmer)} />

                        <div className={styles.ownerCard}>
                            <div className={classNames(styles.ownerAvatar, styles.shimmer)} />
                            <div className={styles.ownerInfo}>
                                <div className={classNames(styles.ownerName, styles.shimmer)} />
                                <div className={classNames(styles.ownerType, styles.shimmer)} />
                            </div>
                        </div>

                        <div className={classNames(styles.button, styles.shimmer)} />
                        <div className={classNames(styles.button, styles.shimmer)} />
                    </div>
                </aside>
            </div>
        </div>
    );
};
