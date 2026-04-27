import React from "react";
import AppWrapper from "@/widgets/Wrappers/AppWrapper";
import "@/styles/globals.scss";
import type { Metadata } from 'next'
import { SessionProviderWrapper } from '@/widgets/Wrappers/SessionProviderWrapper'

export const metadata: Metadata = {
    title: "HomeSharing",
    other: {
        'font-display': 'swap',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru">
            <body>
                <SessionProviderWrapper>
                    <AppWrapper>
                        {children}
                    </AppWrapper>
                </SessionProviderWrapper>
            </body>
        </html>
    )
}
