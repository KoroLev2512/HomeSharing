import React from "react";
import { BLACK_COLOR } from "@/shared/const/colors";
import { IconProps } from "./types";

export const LogoIcon = (
    {
        color = BLACK_COLOR,
        height = 24,
        width = 24,
    }: IconProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                d="M7.02051 10.2568H16.9795V0H24V24H16.9795V17.1582H19.4756L12 13.0527L4.52441 17.1582H7.02051V24H0V0H7.02051V10.2568Z"
                fill={color}
            />
        </svg>
    );
};
