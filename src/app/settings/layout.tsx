import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";

export const metadata: Metadata = {
    title: "Параметры | HomeSharing",
    description: "Настройки профиля, аватара и роли арендодателя",
};

export default async function SettingsLayout({
    children,
}: {
    children: ReactNode;
}): Promise<ReactNode> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }
    return children;
}
