import React from "react";
import { BLACK_COLOR } from "@/shared/const/colors";
import { IconProps } from "./types";

export const DoneAllIcon = ({
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
                d="M18 7L16.59 5.59L10 12.17L7.41 9.59L6 11L10 15L18 7ZM22 7L20.59 5.59L14 12.17L13.17 11.34L11.76 12.75L13.17 14.17L14 15L22 7Z"
                fill={color}
            />
        </svg>
    );
};

