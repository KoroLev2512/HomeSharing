import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { HomeLayout } from "@/layouts/Home/HomeLayout";
import { authOptions } from "@/shared/lib/auth";

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/listings");
    }

    return <HomeLayout />;
}
