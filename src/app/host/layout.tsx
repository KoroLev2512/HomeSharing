import React from 'react';
import { HostShell } from '@/layouts/Host/HostShell';

export default function HostLayout({ children }: { children: React.ReactNode }) {
    return <HostShell>{children}</HostShell>;
}
