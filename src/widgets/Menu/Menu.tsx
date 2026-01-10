import React from "react";
import { MenuProps } from "./types";
import styles from "./styles.module.scss";
import classNames from "classnames";

export const Menu = ({ children, onClick, className, isClosed, isMobile }: MenuProps) => {
    return (
        <ul 
            className={classNames(styles.menu, className, {
                [styles.menuClosed]: isClosed,
                [styles.menuMobile]: isMobile,
            })} 
            onClick={onClick}
        >
            {children}
        </ul>
    );
};