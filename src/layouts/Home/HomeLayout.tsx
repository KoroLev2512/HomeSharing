"use client";

import React, {useState} from 'react';
import {SecondaryButton} from "@/ui/Button";
import {Section} from "@/ui/Section"
import {FlatCardList} from "@/entities/FlatCard/FlatCardList";

import styles from "./styles.module.scss";
import {PlugIcon} from "@/lib/icons/PlugIcon";
import {IFlatCard} from "@/lib/store/flats";
import {Flat} from "@/entities/Flat";
import Link from "next/link";

export const HomeLayout: React.FC = () => {
    const [selectedFlat, setSelectedFlat] = useState<IFlatCard | null>(null);
    return (
        <>
            <Section margin={0}>
                <div className={styles.headingWrapper}>
                    <Link href={"/api/auth/signin"}>
                        <SecondaryButton onClick={() => console.log("Выйти")} className={styles.button}>
                            Войти
                        </SecondaryButton>
                    </Link>
                </div>
            </Section>
            <Section margin={0}>
                <div className={styles.wrapper}>
                    <FlatCardList setSelectedFlat={setSelectedFlat} selectedFlat={selectedFlat}/>
                    {selectedFlat ?
                        <Flat flat={selectedFlat}/>
                        :
                        <div className={styles.plug}>
                            <PlugIcon/>
                            <div className={styles.plugText}>
                                Выберите объект из списка чтобы увидеть информацию о нем.
                            </div>
                        </div>
                    }
                </div>
            </Section>
        </>
    );
}
