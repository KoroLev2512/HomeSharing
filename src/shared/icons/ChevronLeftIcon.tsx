import React from "react";
import { BLACK_COLOR } from "@/shared/const/colors";
import { IconProps } from "./types";

export const ChevronLeftIcon = ({
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
                d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
                fill={color}
            />
        </svg>
    );
};

