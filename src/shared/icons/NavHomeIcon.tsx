import React from "react";
import { IconProps } from "./types";

export const NavHomeIcon = ({ width = 20, height = 20, color = "#000000" }: IconProps): React.JSX.Element => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M4.5 10.75L12 4.75L19.5 10.75V19C19.5 19.5523 19.0523 20 18.5 20H14V14.75C14 14.3358 13.6642 14 13.25 14H10.75C10.3358 14 10 14.3358 10 14.75V20H5.5C4.94772 20 4.5 19.5523 4.5 19V10.75Z"
                stroke={color}
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
};
