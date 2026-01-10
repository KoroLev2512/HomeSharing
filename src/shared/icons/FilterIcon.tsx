import React from "react";
import { BLACK_COLOR } from "@/shared/const/colors";
import { IconProps } from "./types";

export const FilterIcon = ({
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
                d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z"
                fill={color}
            />
        </svg>
    );
};

