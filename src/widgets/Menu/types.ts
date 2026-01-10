import React from "react";
import { MenuItemProps } from "../MenuItem/types";

export type MenuProps = {
    children: React.ReactElement<MenuItemProps[]>[];
    onClick?: (e: React.MouseEvent<HTMLUListElement>) => void;
    className?: string;
    isClosed?: boolean;
    isMobile?: boolean;
};