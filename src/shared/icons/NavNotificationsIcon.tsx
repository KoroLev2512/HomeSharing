import React from "react";
import { IconProps } from "./types";

export const NavNotificationsIcon = ({ width = 20, height = 20, color = "#000000" }: IconProps): React.JSX.Element => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M7 10C7 7.23858 9.23858 5 12 5C14.7614 5 17 7.23858 17 10V14.5L18.5 16.5H5.5L7 14.5V10Z"
                stroke={color}
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path d="M10 18C10.3333 18.6667 11.0333 19 12 19C12.9667 19 13.6667 18.6667 14 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
};
