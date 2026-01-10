"use client";
import React, {useEffect} from "react";
import WorkerPage from "@/layouts/Errors/503";
import Loader from "@/shared/ui/Loader/Loader";
import {useUserStore} from "../entities/user";
import {isNull, isString} from "lodash";
import {usePathname} from "next/navigation";
import {NavigationBar} from "../widgets/NavigationBar";
import {ContentWrapper} from "../widgets/ContentWraper";
import {PageWrapper} from "../widgets/PageWrapper";

export const ServerGuard = ({ children, pageProps: { session } }: { children: React.ReactNode, pageProps: any }) => {
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
            <PageWrapper>
                <NavigationBar />
                <ContentWrapper>
                    <Loader/>
                </ContentWrapper>
            </PageWrapper>
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
