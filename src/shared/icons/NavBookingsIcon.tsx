import React from "react";
import { IconProps } from "./types";

export const NavBookingsIcon = ({ width = 20, height = 20, color = "#000000" }: IconProps): React.JSX.Element => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="5.5" width="16" height="14.5" rx="2" stroke={color} strokeWidth="1.8" />
            <path d="M8 4V7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16 4V7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M4.5 10H19.5" stroke={color} strokeWidth="1.8" />
        </svg>
    );
};
