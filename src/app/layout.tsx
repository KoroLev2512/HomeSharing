import React from "react";
import { getServerSession } from "next-auth";
import AppWrapper from "@/widgets/Wrappers/AppWrapper";
import "@/styles/globals.scss";
import type { Metadata } from 'next'
import { SessionProviderWrapper } from '@/widgets/Wrappers/SessionProviderWrapper'
import { authOptions } from '@/shared/lib/auth'

export const metadata: Metadata = {
    title: "HomeSharing",
    other: {
        'font-display': 'swap',
    },
};

export default async function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="ru">
            <body>
                <SessionProviderWrapper session={session}>
                    <AppWrapper>
                        {children}
                    </AppWrapper>
                </SessionProviderWrapper>
            </body>
        </html>
    )
}
