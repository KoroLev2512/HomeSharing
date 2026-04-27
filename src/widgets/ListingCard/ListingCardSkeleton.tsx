import React from 'react';
import classNames from 'classnames';
import styles from './skeleton.module.scss';

interface IProps {
    layout?: 'list' | 'grid';
    className?: string;
}

const ListSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={classNames(styles.card, styles.layoutList, className)} aria-hidden>
        <div className={classNames(styles.image, styles.shimmer)} />
        <div className={styles.body}>
            <div className={styles.priceRow}>
                <div className={classNames(styles.line, styles.linePrice, styles.shimmer)} />
                <div className={classNames(styles.line, styles.lineRating, styles.shimmer)} />
            </div>
            <div className={classNames(styles.line, styles.lineTitle, styles.shimmer)} />
            <div className={classNames(styles.line, styles.lineSubtitle, styles.shimmer)} />
            <div className={classNames(styles.line, styles.lineAddress, styles.shimmer)} />
            <div className={classNames(styles.line, styles.lineMeta, styles.shimmer)} />
            <div className={styles.footerSpacer} />
            <div className={styles.footerRow}>
                <div className={classNames(styles.line, styles.lineFooterLeft, styles.shimmer)} />
                <div className={classNames(styles.line, styles.lineFooterRight, styles.shimmer)} />
            </div>
        </div>
    </div>
);

const GridSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={classNames(styles.card, styles.layoutGrid, className)} aria-hidden>
        <div className={styles.imageWrapper}>
            <div className={classNames(styles.gridImage, styles.shimmer)} />
            <div className={styles.gridDots}>
                <span className={styles.gridDot} />
                <span className={styles.gridDot} />
                <span className={styles.gridDot} />
            </div>
            <div className={classNames(styles.gridFavorite, styles.shimmer)} />
        </div>
        <div className={styles.gridBody}>
            <div className={classNames(styles.line, styles.gridPrice, styles.shimmer)} />
            <div className={classNames(styles.line, styles.gridTitle, styles.shimmer)} />
            <div className={classNames(styles.line, styles.gridAddress, styles.shimmer)} />
            <div className={styles.gridFooterRow}>
                <div className={classNames(styles.line, styles.gridChip, styles.shimmer)} />
                <div className={classNames(styles.line, styles.gridChip, styles.shimmer)} />
            </div>
        </div>
    </div>
);

export const ListingCardSkeleton: React.FC<IProps> = ({ layout = 'list', className }) => {
    if (layout === 'grid') return <GridSkeleton className={className} />;
    return <ListSkeleton className={className} />;
};

interface IGridProps {
    count?: number;
    layout?: 'list' | 'grid';
    className?: string;
}

export const ListingCardSkeletonList: React.FC<IGridProps> = ({ count = 6, layout = 'list', className }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <ListingCardSkeleton key={i} layout={layout} className={className} />
            ))}
        </>
    );
};
