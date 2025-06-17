import classNames from "classnames";
import React, { FC } from "react";
import { Text } from "@/ui/Text";

import styles from "./style.module.scss";

interface Props extends React.InputHTMLAttributes<HTMLInputElement>{
    children?: string;
    label?: string;
    icon?: React.ReactNode;
}

export const Input: FC<Props> = ({
                                     children,
                                     label,
                                     className,
                                     icon,
                                     ...restProps
                                 }) => {
    return (
        <div className={classNames(styles.input_all)}>
            <div className={className}>
                {icon ? icon : null}
                <Text as={"p"}>
                    {label}
                </Text>
                <input
                    className={classNames(styles.input)}
                    value={children}
                    {...restProps}
                />
            </div>
        </div>
    );
};
