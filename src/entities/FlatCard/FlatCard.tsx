import React, {Dispatch, SetStateAction} from "react";
import Image from "next/image";
import {CalendarIcon} from "@/lib/icons/CalendarIcon";
import {LocationIcon} from "@/lib/icons/LocationIcon";
import {IFlatCard} from "@/lib/store/flats";

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
            <Image
                src={flat.img}
                alt="Изображение квартиры"
                className={styles.image}
                width={300}
                height={200}
            />
            <div className={styles.description}>
                {flat.tagFlat && <div className={`${styles.tag} ${flat.tagFlat.name}`}>{flat.tagFlat.text}</div>}
                <div className={styles.dates}>
                    <div className={styles.descriptionIcon}><CalendarIcon/></div>
                    <div className={styles.datesText}>{flat.dateRange}</div>
                </div>
                <div className={styles.location}>
                    <div className={styles.locationIcon}><LocationIcon/></div>
                    <div className={styles.locationText}>{flat.address}</div>
                </div>
            </div>
        </div>
    );
};