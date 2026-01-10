import React from "react";
import { BLACK_COLOR } from "@/shared/const/colors";
import { IconProps } from "./types";

export const CheckboxOutlineBlankIcon = ({
    color = BLACK_COLOR,
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
            stroke={color}
            strokeWidth="2"
        >
            <path
                d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"
                fill={color}
            />
        </svg>
    );
};

