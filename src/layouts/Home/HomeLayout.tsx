"use client";

import React from "react";
import { HostListingsBoard } from "@/layouts/Host/HostListingsBoard";
import { HostShell } from "@/layouts/Host/HostShell";

export const HomeLayout: React.FC = () => {
    return (
        <HostShell>
            <HostListingsBoard />
        </HostShell>
    );
};
