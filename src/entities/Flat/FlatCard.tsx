import Image from "next/image";
import React from "react";
import {Section} from "../../ui/Section";
import {Text} from "../../ui/Text";
import styles from "./styles.module.scss";
import {CalendarIcon} from "@/lib/icons/CalendarIcon";
import {LocationIcon} from "@/lib/icons/LocationIcon";
import { ITag } from "./FlatCardList";

interface IProps {
    isDisabled?: boolean;
    tag?: ITag;
}

export const FlatCard = ({isDisabled, tag}: IProps) => {
    console.log(tag, 'tag')
    return (
        <div className={isDisabled ? `${styles.flatCardDisabled} ${styles.flatCard}` : styles.flatCard}>
            <img
                src="/rooms/room.png"
                alt="Изображение квартиры"
                className={styles.image}
            />
            <div className={styles.description}>
                {tag && <div className={`${styles.tag} ${tag.name}`}>{tag.text}</div>}
                <div className={styles.dates}>
                    <div className={styles.descriptionIcon}><CalendarIcon/></div>
                    <div className={styles.datesText}>29 апр. 2024 – 30 апр. 2024</div>
                </div>
                <div className={styles.location}>
                    <div className={styles.locationIcon}><LocationIcon/></div>
                    <div className={styles.locationText}>Санкт-Петербург, ул. Ломоносова 9</div>
                </div>
            </div>
        </div>
    );
};