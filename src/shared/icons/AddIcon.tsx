import React from "react";
import { IconProps } from "./types";

export const AddIcon = (
    {
        color = "#FFFFFF",
        height = 24,
        width = 24,
    }: IconProps) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 5V19M5 12H19"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

