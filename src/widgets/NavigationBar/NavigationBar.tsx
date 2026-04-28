"use client";

import React, {useMemo, useState, useEffect} from "react";
import {Logotype} from "@/shared/ui/Logotype";
import {Menu} from "@/widgets/Menu";
import {MenuItem} from "@/widgets/MenuItem";
import {MenuItemProps} from "@/widgets/MenuItem/types";
import {useAppStore} from "@/shared/store/appStore";
import classNames from "classnames";
import {usePathname, useRouter} from "next/navigation";
import {compact} from "lodash";
import {HomeIcon, MessageIcon, NotifyIcon, SettingsIcon, ProfileIcon, StarIcon, CalendarIcon} from "@/shared/icons";
import {useSession, signOut} from "next-auth/react";
import {Burger} from "../../shared/ui/Burger";
import Link from "next/link";

import styles from "./styles.module.scss";

const NavigationBarToggle = ({ menuPageIsOpen }: { menuPageIsOpen: boolean }): React.JSX.Element => {
    const toggleMenuPage = useAppStore(state => state.toggleMenuPage);
    const toggleProfilePage = useAppStore(state => state.toggleProfilePage);
    const profilePageIsClose = useAppStore(state => state.profilePageIsClose);
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

export const NavigationBar = (): React.JSX.Element => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 720);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const menuPageIsOpen = useAppStore(state => state.menuPageIsOpen);
    const toggleMenuPage = useAppStore(state => state.toggleMenuPage);
    const route = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const isAuthenticated = status === 'authenticated' && !!session?.user;
    const isHost = isAuthenticated && Boolean(session?.user?.isService);

    const MenuItems: MenuItemProps[] = useMemo(() => compact([
        {icon: <HomeIcon/>, name: "Объявления", href: "/listings"},
        {icon: <StarIcon color="#000000" width={16} height={16} />, name: "Избранное", href: "/favorites"},
        isHost ? {icon: <HomeIcon/>, name: "Мои объявления", href: "/host/listings"} : null,
        isHost ? {icon: <HomeIcon/>, name: "Заявки гостей", href: "/host/bookings"} : null,
        isAuthenticated ? {icon: <CalendarIcon color="#000000" width={24} height={24} />, name: "Бронирования", href: "/bookings"} : null,
        isAuthenticated ? {icon: <MessageIcon/>, name: "Сообщения", href: "/messages"} : null,
        isAuthenticated ? {icon: <NotifyIcon/>, name: "Уведомления", href: "/notifications"} : null,
        isAuthenticated ? {icon: <SettingsIcon/>, name: "Параметры", href: "/settings"} : null,
    ]), [isAuthenticated, isHost]);

    const homeHref = isAuthenticated ? "/" : "/listings";

    const handleSignOut = async () => {
        if (isSigningOut) return;

        setIsSigningOut(true);

        try {
            await signOut({
                callbackUrl: '/listings'
            });
        } catch (error) {
            router.replace('/listings');
        } finally {
            setIsSigningOut(false);
        }
    };

    const handleLoginClick = () => {
        router.push('/login');
    };

    const showMenu = menuPageIsOpen;
    const isItemActive = (href: string): boolean => {
        if (!route) return false;
        return route === href || route.startsWith(`${href}/`);
    };

    if (isMobile) {
        return (
            <nav className={styles.mobileBar} aria-label="Мобильная навигация">
                <ul className={styles.mobileNav}>
                    {MenuItems.map((item, index) => (
                        <li key={`${item.href}-${index}`} className={styles.mobileItem}>
                            <Link
                                href={item.href ?? '#'}
                                className={classNames(styles.mobileLink, {
                                    [styles.mobileLinkActive]: Boolean(item.href && isItemActive(item.href)),
                                })}
                            >
                                {item.icon}
                                <span className={styles.mobileLabel}>{item.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        );
    }

    return (
        <div 
            className={classNames(styles.container, {[styles.closedBar]: showMenu})}
        >
            <div className={styles.header}>
                <div className={classNames(styles.toggle, styles.logoContainer)}>
                    <Link href={homeHref}>
                        <Logotype isOpen={!showMenu}/>
                    </Link>
                </div>
                <div className={classNames(styles.burgerBtnOpen, {[styles.burgerBtnClose]: showMenu})}>
                    <NavigationBarToggle menuPageIsOpen={showMenu} />
                </div>
            </div>
            <div className={classNames({[styles.navigationWrapper]: showMenu})} onClick={() => {
                toggleMenuPage(false);
            }}>
                <div className={classNames(styles.navigation, {[styles.openNav]: showMenu})} onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <Menu 
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        isClosed={showMenu}
                        isMobile={isMobile}
                    >
                        {MenuItems.map((item, index) => (
                            <MenuItem {...item} key={index} active={route ?? ""} isClosed={showMenu}/>
                        ))}
                    </Menu>
                </div>
            </div>
            <div className={styles.user}>
                {isAuthenticated ? (
                    showMenu ? (
                        // Компактный вид (закрытый навбар): аватар + иконка выхода
                        <div className={styles.userRowCompact}>
                            <div className={styles.avatar}>
                                <img
                                    src={typeof session.user.image === 'string' && session.user.image ? session.user.image : '/users/user_1.webp'}
                                    alt="Аватар"
                                />
                            </div>
                            <button
                                onClick={handleSignOut}
                                className={styles.signOutIconBtn}
                                aria-label="Выйти"
                                disabled={isSigningOut}
                            >
                                {/* Иконка выхода */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <mask id="mask0_738_8845" style={{ maskType: 'alpha' } as any} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                                        <rect width="24" height="24" fill="#D9D9D9"/>
                                    </mask>
                                    <g mask="url(#mask0_738_8845)">
                                        <path d="M5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H11C11.2833 3 11.5208 3.09583 11.7125 3.2875C11.9042 3.47917 12 3.71667 12 4C12 4.28333 11.9042 4.52083 11.7125 4.7125C11.5208 4.90417 11.2833 5 11 5H5V19H11C11.2833 19 11.5208 19.0958 11.7125 19.2875C11.9042 19.4792 12 19.7167 12 20C12 20.2833 11.9042 20.5208 11.7125 20.7125C11.5208 20.9042 11.2833 21 11 21H5ZM17.175 13H10C9.71667 13 9.47917 12.9042 9.2875 12.7125C9.09583 12.5208 9 12.2833 9 12C9 11.7167 9.09583 11.4792 9.2875 11.2875C9.47917 11.0958 9.71667 11 10 11H17.175L15.3 9.125C15.1167 8.94167 15.025 8.71667 15.025 8.45C15.025 8.18333 15.1167 7.95 15.3 7.75C15.4833 7.55 15.7167 7.44583 16 7.4375C16.2833 7.42917 16.525 7.525 16.725 7.725L20.3 11.3C20.5 11.5 20.6 11.7333 20.6 12C20.6 12.2667 20.5 12.5 20.3 12.7L16.725 16.275C16.525 16.475 16.2875 16.5708 16.0125 16.5625C15.7375 16.5542 15.5 16.45 15.3 16.25C15.1167 16.05 15.0292 15.8125 15.0375 15.5375C15.0458 15.2625 15.1417 15.0333 15.325 14.85L17.175 13Z" fill="black"/>
                                    </g>
                                </svg>
                            </button>
                        </div>
                    ) : (
                        // Полный вид (открытый навбар): имя/почта/роль и кнопка Выйти
                        <div className={styles.userInfo}>
                            <div className={styles.avatarFull}>
                                <img
                                    src={typeof session.user.image === 'string' && session.user.image ? session.user.image : '/users/user_1.webp'}
                                    alt="Аватар"
                                />
                            </div>
                            <div className={styles.username}>
                                {session.user.name || session.user.email}
                            </div>
                            <div className={styles.email}>
                                {session.user.email}
                            </div>
                            <div className={styles.role}>
                                {session.user.isAdmin ? 'Администратор' :
                                 session.user.isService ? 'Арендодатель' : 'Гость'}
                            </div>
                            <button 
                                onClick={handleSignOut}
                                className={styles.signOutButton}
                                disabled={isSigningOut}
                            >
                                {isSigningOut ? 'Выход...' : 'Выйти'}
                            </button>
                        </div>
                    )
                ) : status === 'loading' ? (
                    <div className={styles.loaderContainer} aria-hidden>
                        <div className={classNames(styles.userSkeletonAvatar, styles.userSkeletonShimmer)} />
                        {!showMenu && (
                            <div className={styles.userSkeletonLines}>
                                <div className={classNames(styles.userSkeletonLine, styles.userSkeletonShimmer)} />
                                <div className={classNames(styles.userSkeletonLine, styles.userSkeletonLineShort, styles.userSkeletonShimmer)} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.userInfo}>
                        <button 
                            onClick={handleLoginClick}
                            className={classNames(styles.loginLink, {[styles.loginLinkClosed]: showMenu})}
                        >
                            {showMenu ? (
                                <ProfileIcon width={24} height={24} />
                            ) : (
                                'Войти'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
