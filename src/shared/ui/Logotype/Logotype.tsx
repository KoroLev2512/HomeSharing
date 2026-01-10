import React from "react";
import { LogoIcon } from "@/shared/icons";
import styles from "./styles.module.scss";
import classNames from "classnames";

interface LogotypeProps {
    isOpen?: boolean;
}

export const Logotype = ({ isOpen = true }: LogotypeProps) => {
    return (
        <div className={classNames(styles.wrapper, { [styles.closed]: !isOpen })}>
            <LogoIcon width={isOpen ? 32 : 24} height={isOpen ? 32 : 24} />
            <span className={classNames(styles.logotext, { [styles.hidden]: !isOpen })}>
                HomeSharing
            </span>
        </div>
    );
};
