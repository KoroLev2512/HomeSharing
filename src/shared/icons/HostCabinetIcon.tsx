import React from "react";
import { IconProps } from "./types";

export const HostCabinetIcon = ({ width = 20, height = 20, color = "#000000" }: IconProps): React.JSX.Element => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M4 10.5L12 4L20 10.5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V10.5Z"
                stroke={color}
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path
                d="M9.5 20V14.5C9.5 13.6716 10.1716 13 11 13H13C13.8284 13 14.5 13.6716 14.5 14.5V20"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <circle cx="17" cy="7" r="2.25" fill="white" stroke={color} strokeWidth="1.8" />
        </svg>
    );
};
