import React from "react";
import { IconProps } from "./types";

export const AdminPanelIcon = ({ width = 20, height = 20, color = "#000000" }: IconProps): React.JSX.Element => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
            <path d="M8 9H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8 12H13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16.5" cy="15.5" r="2.5" fill="white" stroke={color} strokeWidth="1.8" />
        </svg>
    );
};
