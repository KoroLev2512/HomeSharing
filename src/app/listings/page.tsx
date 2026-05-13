import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Объявления',
    description: 'Поиск квартир, комнат и домов для аренды',
};

export default async function ListingsPage() {
    redirect("/");
}
