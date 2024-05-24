import React, {useMemo} from "react";
import {Logotype} from "@/ui/Logotype";
import {Menu} from "@/ui/Menu";
import {MenuItem} from "@/ui/MenuItem";
import { MenuItemProps } from "@/ui/MenuItem/types";
import {useAppStore} from "@/lib/store/appStore";
import classNames from "classnames";
import {useRouter} from "next/router";
import {compact} from "lodash";
import {HomeIcon} from "@/lib/icons/HomeIcon";
import {MessageIcon} from "@/lib/icons/MessageIcon"
import {SearchIcon} from "@/lib/icons/SearchIcon";
import {useIfUserRole} from "@/entities/User";
import {Input} from "@/ui/Input";

import styles from "./styles.module.scss";
import {NotifyIcon} from "@/lib/icons/NotifyIcon";
import {SettingsIcon} from "@/lib/icons/SettingsIcon";

const NavigationBarToggle = (): JSX.Element => {
    const [toggleMenuPage, menuPageIsOpen, toggleProfilePage, profilePageIsClose] = useAppStore(state => [state.toggleMenuPage, state.menuPageIsOpen, state.toggleProfilePage, state.profilePageIsClose]);
    return (
        <div
            onClick={() => {
                toggleMenuPage();
                if (profilePageIsClose && window.innerWidth <= 720) {
                    toggleProfilePage();
                }
            }}
        >
        </div>
    );
};

export const NavigationBar = (): JSX.Element => {
    const [menuPageIsOpen, toggleMenuPage, toggleProfilePage] = useAppStore(state => [state.menuPageIsOpen, state.toggleMenuPage, state.toggleProfilePage]);
    const {route} = useRouter();
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
                <NavigationBarToggle/>
                <div
                    className={classNames(styles.toggle, {[styles.toggleBeforeOpen]: menuPageIsOpen}, [styles.logoContainer])}>
                    <Logotype/>
                </div>
            </div>
            <Input
                type="text"
                placeholder="Найти"
                className={styles.input}
                // onChange={handleChange}
                // icon={<SearchIcon/>}
            />
            <div className={classNames(styles, {[styles.navigationWrapper]: menuPageIsOpen})} onClick={() => {
                toggleMenuPage(false);
            }}>
                <div className={classNames(styles.navigation, {[styles.openNav]: menuPageIsOpen})} onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <Menu>
                        {MenuItems.map((item, index) => (
                            <MenuItem {...item} key={index} active={route}/>
                        ))}
                    </Menu>
                </div>
            </div>
        </div>
    );
};
