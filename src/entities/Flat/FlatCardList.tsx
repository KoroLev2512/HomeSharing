import React from 'react';
import styles from "./styles.module.scss";
import {CalendarIcon} from "@/lib/icons/CalendarIcon";
import {LocationIcon} from "@/lib/icons/LocationIcon";
import {FlatCard} from "@/entities/Flat/FlatCard";

export interface ITag {
    name: string;
    text: string
}
const tags: Record<string, ITag> = {
    lilac: {name: 'lilac-tag', text: 'Квартира занята'},
    orange: {name: 'orange-tag', text: 'Требуется уборка'},
    gray: {name: 'gray-tag', text: 'Доступ истек'},
    green: {name: 'green-tag', text: 'Не требуется'}
}
export const FlatCardList = () => {
    return (
        <div className={styles.flatCardList}>
            <FlatCard isDisabled tag={tags.gray} />
            <FlatCard />
            <FlatCard tag={tags.orange} />
            <FlatCard tag={tags.green} />
            <FlatCard tag={tags.lilac} />
        </div>
    );
};
