import classNames from "classnames";
import Image from "next/image";
import React from "react";
import { Section } from "../Section";
import { Text } from "../Text";
import styles from "./styles.module.scss";



export const FlatCard = () => {
    return (
            <div className={styles.card}>
                <Image
                    src="/public/rooms/room.jpg"
                    alt="Изображение квартиры"
                    layout="fill"
                />
                {/*<div className={styles.shadowWrapper}></div>*/}
                {/*<Section className={styles.content}>*/}
                {/*    <Text as="h5">{title}</Text>*/}
                {/*</Section>*/}
            </div>
    );
};