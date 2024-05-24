import React from "react";
import { Text } from "@/ui/Text";

import styles from "./styles.module.scss";

export const Logotype = () => {
    return (
        <div className={styles.wrapper}>
            <img
                src='/icons/logo.svg'
                alt="logo"
            />
            <Text as="h2" className={styles.logotext}>
                LockBox
            </Text>
        </div>
    );
};
