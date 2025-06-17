import React, {Dispatch, SetStateAction} from 'react';
import {FlatCard} from "@/entities/FlatCard/FlatCard";
import {flats, IFlatCard} from "@/lib/store/flats";
import styles from "./styles.module.scss";

interface IProps {
    setSelectedFlat: Dispatch<SetStateAction<IFlatCard | null>>;
    selectedFlat: IFlatCard | null;
}

export const FlatCardList = ({setSelectedFlat, selectedFlat}: IProps) => {
    return (
        <div className={styles.flatCardList}>
            {flats.length > 0 ? (
                flats.map(flat => (
                    <FlatCard
                        flat={flat}
                        key={flat.id}
                        setSelectedFlat={setSelectedFlat}
                        selectedFlat={selectedFlat}
                    />
                ))
            ) : (
                <p>Нет доступных квартир</p>
            )}
        </div>
    );
};
