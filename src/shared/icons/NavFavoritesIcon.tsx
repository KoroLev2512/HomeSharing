import React from "react";
import { IconProps } from "./types";

export const NavFavoritesIcon = ({ width = 20, height = 20, color = "#000000" }: IconProps): React.JSX.Element => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 18.5L6.71073 21.2789L7.72025 15.3894L3.44049 11.2211L9.35536 10.3605L12 5L14.6446 10.3605L20.5595 11.2211L16.2798 15.3894L17.2893 21.2789L12 18.5Z"
                stroke={color}
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
};
