import React from "react";
import Image from "next/image";
import logo from "@/../public/icons/logo.svg";
import styles from "./styles.module.scss";

export const Logotype = () => {
    return (
        <div className={styles.wrapper}>
            <Image
                src={logo}
                alt="logo"
                width={90}
            />
        </div>
    );
};
