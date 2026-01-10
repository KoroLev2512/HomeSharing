import React from "react";
import { BLACK_COLOR } from "@/shared/const/colors";
import { IconProps } from "./types";

export const ExpandLessIcon = ({
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
        >
            <path
                d="M12 8L6 14L7.41 15.41L12 10.83L16.59 15.41L18 14L12 8Z"
                fill={color}
            />
        </svg>
    );
};

