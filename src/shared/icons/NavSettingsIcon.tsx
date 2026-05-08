import React from "react";
import { IconProps } from "./types";

export const NavSettingsIcon = ({ width = 20, height = 20, color = "#000000" }: IconProps): React.JSX.Element => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3.25" stroke={color} strokeWidth="1.8" />
            <path d="M12 4.25V6.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 17.8V19.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M19.75 12H17.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M6.2 12H4.25" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M17.48 6.52L16.1 7.9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7.9 16.1L6.52 17.48" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M17.48 17.48L16.1 16.1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7.9 7.9L6.52 6.52" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
};
