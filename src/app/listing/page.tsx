import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Объявление',
    description: 'Подробное описание объявления об аренде',
};

export default async function ListingAliasPage() {
    redirect("/");
}
