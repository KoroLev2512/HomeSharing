import React from "react";
import { IconProps } from "./types";

export const NavMessagesIcon = ({ width = 20, height = 20, color = "#000000" }: IconProps): React.JSX.Element => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M5 6.5H19C19.5523 6.5 20 6.94772 20 7.5V16.5C20 17.0523 19.5523 17.5 19 17.5H8L4 20V7.5C4 6.94772 4.44772 6.5 5 6.5Z"
                stroke={color}
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path d="M8 10.5H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8 13.5H13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
};
