import React from 'react';
import Image from "next/image";
import {Title} from "@/ui/Title";
import {User} from "@/entities/User";
import {SecondaryButton} from "@/ui/Button";
import {Section} from "@/ui/Section"
import {FlatCard} from "@/ui/Flat/FlatCard";

import styles from "./styles.module.scss";

interface IProps {
    children?: React.ReactNode;
    user: User | null;
}

export const HomeLayout: React.FC = () => {
    return (
        <>
            <Section margin={0}>
                <div className={styles.headingWrapper}>
                    <Title/>
                    <SecondaryButton onClick={() => console.log("Выйти")} className={styles.button}>
                        Выйти
                    </SecondaryButton>
                </div>
            </Section>
            <Section>
                <div className={styles.wrapper}>
                    <div className={styles.roomList}>
                        <img
                            src="/rooms/room.png"
                            alt="Изображение квартиры"
                            className={styles.image}
                        />
                        <div className={styles.description}>
                            <div className={styles.dates}>
                                29 апр. 2024 – 30 апр. 2024
                            </div>
                            <div className={styles.location}>
                                Санкт-Петербург, ул. Ломоносова 9
                            </div>
                        </div>
                    </div>
                    <div className={styles.roomCard}>
                        eee
                    </div>
                </div>
            </Section>
        </>
    );
}
