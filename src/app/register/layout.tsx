import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";

export const metadata: Metadata = {
    title: "Регистрация | HomeSharing",
    description: "Создание аккаунта HomeSharing",
};

export default async function RegisterLayout({
    children,
}: {
    children: ReactNode;
}): Promise<ReactNode> {
    const session = await getServerSession(authOptions);
    if (session?.user) {
        redirect("/");
    }
    return children;
}
