import React from "react";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import AppWrapper from "@/widgets/Wrappers/AppWrapper";
import "@/styles/globals.scss";
import type { Metadata } from 'next'
import { SessionProviderWrapper } from '@/widgets/Wrappers/SessionProviderWrapper'
import { authOptions } from '@/shared/lib/auth'

const inter = Inter({
    subsets: ["latin", "cyrillic"],
    display: "swap",
    variable: "--font-inter",
    preload: true,
    adjustFontFallback: false,
});

export const metadata: Metadata = {
    title: "HomeSharing",
};

export default async function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="ru" className={inter.variable}>
            <body suppressHydrationWarning>
                <SessionProviderWrapper session={session}>
                    <AppWrapper>
                        {children}
                    </AppWrapper>
                </SessionProviderWrapper>
            </body>
        </html>
    )
}
