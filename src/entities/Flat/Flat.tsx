import Image from "next/image";
import React from "react";
import styles from "./styles.module.scss";
import {CalendarIcon} from "@/lib/icons/CalendarIcon";
import {LocationIcon} from "@/lib/icons/LocationIcon";
import {IFlatCard} from "@/lib/store/flats";

interface IProps {
    flat: IFlatCard;
}

export const Flat = ({flat }: IProps) => {

    return (
        <div
            className={styles.flat}
        >
            <img
                src="/rooms/room.png"
                alt="Изображение квартиры"
                className={styles.image}
            />
            <div className={styles.description}>
                {flat.tag && <div className={`${styles.tag} ${flat.tag.name}`}>{flat.tag.text}</div>}
                <div className={styles.dates}>
                    <div className={styles.descriptionIcon}><CalendarIcon/></div>
                    <div className={styles.datesText}>{flat.date}</div>
                </div>
                <div className={styles.location}>
                    <div className={styles.locationIcon}><LocationIcon/></div>
                    <div className={styles.locationText}>{flat.address}</div>
                </div>
            </div>
        </div>
    );
};