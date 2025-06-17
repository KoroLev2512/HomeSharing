"use client";
import React, {useEffect} from "react";
import WorkerPage from "@/layouts/Errors/503";
import Loader from "@/ui/Loader/Loader";
import {useUserStore} from "@/entities/User";
import {isNull, isString} from "lodash";
import {usePathname} from "next/navigation";
import {NavigationBar} from "@/ui/NavigationBar";
import {ContentWrapper} from "@/ui/ContentWraper";
import {PageWrapper} from "@/ui/PageWrapper";
import {SessionProvider} from "next-auth/react"

export const ServerGuard = ({ children, pageProps: { session } }: { children: JSX.Element, pageProps: any }) => {
    const user = useUserStore(store => store.user);
    const error = useUserStore(store => store.error);
    const getUser = useUserStore(store => store.getUser);
    const pathname = usePathname() ?? "";
    const isOpenPath = ["/error", "/logger"].includes(pathname);

    useEffect(() => {
        if (!isString(error) && error?.status === 403 && !isOpenPath) {
            window.location.replace("/api/login");
        }
    }, [error, isOpenPath, pathname]);

    useEffect(() => {
        if (!isOpenPath) {
            getUser();
        }
    }, [isOpenPath, getUser]);

    if (isNull(user) && !isOpenPath) {
        return(
            <SessionProvider session={session}>
                <PageWrapper>
                    <NavigationBar />
                    <ContentWrapper>
                        <Loader/>
                    </ContentWrapper>
                </PageWrapper>
            </SessionProvider>
        );
    }

    if (!isNull(error)) {
        return <WorkerPage/>;
    }

    if (!isNull(user) || isOpenPath) {
        return children;
    }

    return <Loader/>;
};
