import React from "react";
import { MenuProps } from "./types";
import styles from "./styles.module.scss";
import classNames from "classnames";

export const Menu = ({ children, className, isClosed, isMobile }: MenuProps) => {
    return (
        <nav className={styles.menuNav} aria-label="Разделы сайта">
            <ul
                className={classNames(styles.menu, className, {
                    [styles.menuClosed]: isClosed,
                    [styles.menuMobile]: isMobile,
                })}
            >
                {children}
            </ul>
        </nav>
    );
};
