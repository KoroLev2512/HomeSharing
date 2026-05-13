import React from "react";
import { HomeLayout } from "@/layouts/Home/HomeLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Test',
    description: 'Test page',
};

export default function TestPage() {
    return <HomeLayout />;
} 