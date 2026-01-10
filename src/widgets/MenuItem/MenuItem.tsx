import React, { memo } from "react";
import { MenuItemProps } from "./types";
import styles from "./styles.module.scss";
import Link from "next/link";
import classNames from "classnames";
import { useAppStore } from "@/shared/store/appStore";

const MenuItemComponent = ({ icon, name, href = "#", active, isClosed }: MenuItemProps & { active: string }) => {
    const menuPageIsOpen = useAppStore(state => state.menuPageIsOpen);
    const toggleMenuPage = useAppStore(state => state.toggleMenuPage);
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Закрываем меню только на мобильных устройствах
        if (window.innerWidth <= 720) {
            toggleMenuPage(false);
        }
        // В десктопной версии при закрытом навбаре не меняем состояние
        // Навбар должен оставаться закрытым
    };
    
    return (
        <div
            className={classNames(styles.menuItem, {
                [styles.openNav]: menuPageIsOpen, 
                [styles.active]: href === active,
                [styles.menuItemClosed]: isClosed,
            })}
            onClick={handleClick}
        >
            <Link
                href={href}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                {icon}
                <span className={classNames(styles.menuItemText, {[styles.toggleBeforeOpen]: menuPageIsOpen})}>
					{name}
				</span>
            </Link>
        </div>

    );
};

export const MenuItem = memo(MenuItemComponent);

