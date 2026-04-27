"use client";

import Head from "next/head";
import React, {useEffect} from "react";
import {ContentWrapper} from "@/widgets/ContentWraper"
import {NavigationBar} from "@/widgets/NavigationBar";
import {useAppStore} from "@/shared/store/appStore";
import {parseCookies} from "nookies";
import {useSession} from "next-auth/react";
import { Layout } from "./types";
import {PageWrapper} from "@/widgets/PageWrapper";

const AppWrapper = (props: Layout) => {
    const {children} = props;
    const isDarkMode         = useAppStore(state => state.isDarkMode);
    const toggleDarkMode     = useAppStore(state => state.toggleDarkMode);
    const toggleProfilePage  = useAppStore(state => state.toggleProfilePage);
    const defaultTheme = parseCookies().theme || "light";
    const { status } = useSession();
    // Показываем navbar только для авторизованных. Пока статус загружается — тоже не показываем,
    // чтобы избежать мигания на странице публичных объявлений.
    const showNavBar = status === "authenticated";

    useEffect(() => {
        if (window.innerWidth <= 720) {
            toggleProfilePage(false);
        }
    }, [toggleProfilePage]);

    useEffect(() => {
        if (defaultTheme) {
            toggleDarkMode(defaultTheme === "dark");
        } else {
            toggleDarkMode(false);
        }
    }, [defaultTheme, toggleDarkMode]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    }, [isDarkMode]);

    return (
        <PageWrapper>
            <Head>
                <title>LockBox: Личный кабинет</title>
            </Head>
            {showNavBar && <NavigationBar />}
            <ContentWrapper>{children}</ContentWrapper>
        </PageWrapper>
    );
};

export default AppWrapper;