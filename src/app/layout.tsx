import React from "react";
import { ServerGuard } from "@/guards/ServerGuard";
import AppWrapper from "@/ui/Wrappers/AppWrapper";
import "@/styles/globals.scss";

export const metadata = {
    title: "HomeSharing",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru">
        <body>
        <ServerGuard pageProps={{}}>
            <AppWrapper>
                {children}
            </AppWrapper>
        </ServerGuard>
        </body>
        </html>
    );
}