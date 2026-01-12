import React, {Dispatch, SetStateAction, useMemo} from 'react';
import {FlatCard} from "@/widgets/FlatCard/FlatCard";
import {IFlatCard} from "@/shared/store/flats";
import styles from "./styles.module.scss";

interface IProps {
    flats: IFlatCard[];
    setSelectedFlat: Dispatch<SetStateAction<IFlatCard | null>>;
    selectedFlat: IFlatCard | null;
    activeTab: 'active' | 'archive';
}

export const FlatCardList = ({flats, setSelectedFlat, selectedFlat, activeTab}: IProps) => {
    const filteredFlats = useMemo(() => {
        if (activeTab === 'archive') {
            // В архив попадают только квартиры с тегом "Доступ истек"
            return flats.filter(flat => flat.tagFlat?.text === 'Доступ истек');
        } else {
            // В активные попадают все остальные
            return flats.filter(flat => flat.tagFlat?.text !== 'Доступ истек');
        }
    }, [activeTab, flats]);

    return (
        <div className={styles.flatCardList}>
            {filteredFlats.length > 0 ? (
                filteredFlats.map(flat => (
                    <FlatCard
                        flat={flat}
                        key={flat.id}
                        setSelectedFlat={setSelectedFlat}
                        selectedFlat={selectedFlat}
                    />
                ))
            ) : (
                <p className={styles.emptyMessage}>Нет доступных квартир</p>
            )}
        </div>
    );
};
