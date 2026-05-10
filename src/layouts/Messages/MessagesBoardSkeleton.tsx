"use client";

import React from "react";
import classNames from "classnames";
import layoutStyles from "./styles.module.scss";
import skel from "./messagesSkeleton.module.scss";

const ThreadCardSkeleton: React.FC = () => (
    <article className={layoutStyles.card} aria-hidden>
        <div className={layoutStyles.cardTop}>
            <div>
                <div className={classNames(skel.line, skel.listingTitleLine, skel.shimmer)} />
                <div className={classNames(skel.line, skel.counterpartLine, skel.shimmer)} />
            </div>
            <div className={classNames(skel.line, skel.dateLine, skel.shimmer)} />
        </div>
        <div className={classNames(skel.line, skel.previewLine, skel.shimmer)} />
        <div className={classNames(skel.line, skel.previewLineShort, skel.shimmer)} />
        <div className={layoutStyles.actions}>
            <div className={classNames(skel.line, skel.btnSecondary, skel.shimmer)} />
            <div className={classNames(skel.line, skel.btnPrimary, skel.shimmer)} />
        </div>
    </article>
);

export const MessagesBoardSkeleton: React.FC<{ count?: number; embedded?: boolean }> = ({
    count = 4,
    embedded = false,
}) => {
    const list = (
        <div className={layoutStyles.list}>
            {Array.from({ length: count }).map((_, i) => (
                <ThreadCardSkeleton key={i} />
            ))}
        </div>
    );

    if (embedded) {
        return list;
    }

    return (
        <div className={layoutStyles.root}>
            <header className={layoutStyles.header}>
                <h1 className={layoutStyles.title}>Сообщения</h1>
                <div className={layoutStyles.headerRight}>
                    <div className={classNames(skel.line, skel.headerStatus, skel.shimmer)} aria-hidden />
                </div>
            </header>

            <div className={layoutStyles.info}>
                Чат в реальном времени появится на следующем этапе. Сейчас здесь собраны все диалоги по вашим заявкам и объектам.
            </div>

            {list}
        </div>
    );
};
