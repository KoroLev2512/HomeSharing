"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ReactNode } from "react";

interface SessionProviderWrapperProps {
    children: ReactNode;
    session: Session | null;
}

export const SessionProviderWrapper = ({ children, session }: SessionProviderWrapperProps) => {
    return (
        <SessionProvider
            session={session}
            basePath="/api/auth"
            // В dev при focus/visibility NextAuth снова дергает /api/auth/session; во время
            // перекомпиляции Turbopack или если dev-сервер недоступен — fetch падает с CLIENT_FETCH_ERROR.
            refetchOnWindowFocus={process.env.NODE_ENV === "production"}
        >
            {children}
        </SessionProvider>
    );
};

