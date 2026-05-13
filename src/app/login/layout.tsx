import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";

export const metadata: Metadata = {
    title: "Вход | HomeSharing",
    description: "Вход в аккаунт HomeSharing",
};

export default async function LoginLayout({
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
