/**
 * LEGACY UI
 *
 * Archived card for the old `Flat` dashboard flow.
 * Not used by the active application routes.
 */
import React, {Dispatch, SetStateAction} from "react";
import Image from "next/image";
import {CalendarIcon, LocationIcon, StarIcon} from "@/shared/icons";
import {IFlatCard} from "@/shared/store/flats";

import styles from "./styles.module.scss";

interface IProps {
    flat: IFlatCard;
    setSelectedFlat: Dispatch<SetStateAction<IFlatCard | null>>;
    selectedFlat: IFlatCard | null;
}

export const FlatCard = ({flat, setSelectedFlat, selectedFlat}: IProps) => {
    let flatStyles = styles.flatCard;
    flatStyles += flat.isDisabled ? ' ' + styles.flatCardDisabled : '';
    flatStyles += (flat.id === selectedFlat?.id) ? ' ' + styles.flatCardActive : '';
    return (
        <div
            className={flatStyles}
            onClick={() => setSelectedFlat(flat)}
        >
            {typeof flat.img === 'string' ? (
                <img
                    src={flat.img}
                    alt="Изображение квартиры"
                    className={styles.image}
                    width={100}
                    height={100}
                />
            ) : (
                <Image
                    src={flat.img}
                    alt="Изображение квартиры"
                    className={styles.image}
                    width={100}
                    height={100}
                />
            )}
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.price}>
                        {flat.price || '30 000 ₽'}
                    </div>
                    <div className={styles.rating}>
                        <StarIcon color="#FFB800" width={16} height={16} />
                        <span>{flat.rating || '5.0'}</span>
                    </div>
                </div>
                <div className={styles.details}>
                    <div className={styles.topRow}>
                        {flat.tagFlat && (
                            <div className={`${styles.tag} ${styles[flat.tagFlat.name] || ''}`}>
                                {flat.tagFlat.text}
                            </div>
                        )}
                        <div className={styles.dates}>
                            <CalendarIcon width={20} height={20} />
                            <span className={styles.datesText}>{flat.dateRange}</span>
                        </div>
                    </div>
                    <div className={styles.location}>
                        <LocationIcon width={20} height={20} />
                        <span className={styles.locationText}>{flat.address}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
