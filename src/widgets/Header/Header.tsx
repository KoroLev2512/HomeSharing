import React from 'react';
import { Logotype } from "../../shared/ui/Logotype";

import styles from "./style.module.scss"

export const Header = () => {
    return (
        <div className={styles.warpper}>
            <Logotype/>

        </div>
    );
};
