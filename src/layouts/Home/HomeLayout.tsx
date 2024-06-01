import React from 'react';
import Image from "next/image";
import {Title} from "@/ui/Title";
import {User} from "@/entities/User";
import {SecondaryButton} from "@/ui/Button";
import {Section} from "@/ui/Section"
import {FlatCardList} from "@/entities/Flat/FlatCardList";

import styles from "./styles.module.scss";
import {PlugIcon} from "@/lib/icons/PlugIcon";
import Link from "next/link";

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
                    <Link href={"/api/auth/signin"}>
                        <SecondaryButton onClick={() => console.log("Выйти")} className={styles.button}>
                            Войти
                        </SecondaryButton>
                    </Link>
                </div>
            </Section>
            <Section>
                <div className={styles.wrapper}>
                    <FlatCardList/>
                    <div className={styles.plug}>
                        <PlugIcon/>
                        <div className={styles.plugText}>
                            Выберите объект из списка чтобы увидеть информацию о нем.
                        </div>
                    </div>
                </div>
            </Section>
        </>
    );
}
