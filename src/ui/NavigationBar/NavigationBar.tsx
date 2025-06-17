"use client";

import React, {useMemo} from "react";
import {Logotype} from "@/ui/Logotype";
import {Menu} from "@/ui/Menu";
import {MenuItem} from "@/ui/MenuItem";
import { MenuItemProps } from "@/ui/MenuItem/types";
import {useAppStore} from "@/lib/store/appStore";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import {compact} from "lodash";
import {HomeIcon} from "@/lib/icons/HomeIcon";
import {MessageIcon} from "@/lib/icons/MessageIcon"
import {SearchIcon} from "@/lib/icons/SearchIcon";
import {NotifyIcon} from "@/lib/icons/NotifyIcon";
import {SettingsIcon} from "@/lib/icons/SettingsIcon";
import {useIfUserRole} from "@/entities/User";
import {Input} from "@/ui/Input";
import {Burger} from "@/ui/Burger";

import styles from "./styles.module.scss";

const NavigationBarToggle = (): JSX.Element => {
    const toggleMenuPage = useAppStore(state => state.toggleMenuPage);
    const menuPageIsOpen   = useAppStore(state => state.menuPageIsOpen);
    const toggleProfilePage= useAppStore(state => state.toggleProfilePage);
    const profilePageIsClose= useAppStore(state => state.profilePageIsClose);
    return (
        <div
            className={styles.burger}
            onClick={() => {
                toggleMenuPage();
                if (profilePageIsClose && window.innerWidth <= 720) {
                    toggleProfilePage();
                }
            }}
        >
            <Burger
                menuPageIsOpen={menuPageIsOpen}
            />
        </div>
    );
};

export const NavigationBar = (): JSX.Element => {
    const menuPageIsOpen = useAppStore(state => state.menuPageIsOpen);
    const toggleMenuPage = useAppStore(state => state.toggleMenuPage);
    const route = usePathname();
    const ifUser = useIfUserRole();
    const MenuItems: MenuItemProps[] = useMemo(() => compact([
        { icon: <HomeIcon />, name: "Главная", href: "/" },
        { icon: <MessageIcon />, name: "Cообщения", href: "/" },
        { icon: <NotifyIcon />, name: "Уведомления", href: "/" },
        { icon: <SettingsIcon />, name: "Параметры", href: "/" },
    ]), [ifUser.isAdmin]);

    return (
        <div className={classNames(styles.container, {[styles.closedBar]: menuPageIsOpen})}>
            <div className={styles.header}>
                <div className={classNames(styles.toggle, {[styles.toggleBeforeOpen]: menuPageIsOpen}, [styles.logoContainer])}>
                    <Logotype/>
                </div>
                <div className={classNames(styles.burgerBtnOpen, {[styles.burgerBtnClose]: menuPageIsOpen})}>
                    <NavigationBarToggle/>
                </div>
            </div>
            <Input
                type="text"
                placeholder="Найти"
                className={classNames(styles.input, {[styles.inputClose]: menuPageIsOpen})}
                // onChange={handleChange}
                icon={<SearchIcon/>}
            />
            <div className={classNames(styles, {[styles.navigationWrapper]: menuPageIsOpen})} onClick={() => {
                toggleMenuPage(false);
            }}>
                <div className={classNames(styles.navigation, {[styles.openNav]: menuPageIsOpen})} onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <Menu>
                        {MenuItems.map((item, index) => (
                            <MenuItem {...item} key={index} active={route ?? ""}/>
                        ))}
                    </Menu>
                </div>
            </div>
        </div>
    );
};
