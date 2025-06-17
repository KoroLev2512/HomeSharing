"use client";

import Head from "next/head";
import React, {useEffect} from "react";
import {ContentWrapper} from "@//ui/ContentWraper"
import {NavigationBar} from "@/ui/NavigationBar";
import {useAppStore} from "@/lib/store/appStore";
import {parseCookies} from "nookies";
import { Layout } from "./types";
import {PageWrapper} from "@/ui/PageWrapper";

const AppWrapper = (props: Layout) => {
    const {children} = props;
    const isDarkMode         = useAppStore(state => state.isDarkMode);
    const toggleDarkMode     = useAppStore(state => state.toggleDarkMode);
    const toggleProfilePage  = useAppStore(state => state.toggleProfilePage);
    const defaultTheme = parseCookies().theme || "light";

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
            <NavigationBar />
            <ContentWrapper>{children}</ContentWrapper>
        </PageWrapper>
    );
};

export default AppWrapper;