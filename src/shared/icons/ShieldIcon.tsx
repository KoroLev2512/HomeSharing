import React from "react";
import { BLACK_COLOR } from "@/shared/const/colors";
import { IconProps } from "./types";

export const ShieldIcon = ({
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
                d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2ZM12 20C8.13 18.87 6 15.24 6 11.09V6.31L12 4.19L18 6.31V11.09C18 15.24 15.87 18.87 12 20ZM10.59 15.41L7.41 12.23L8.82 10.82L10.59 12.59L15.17 8L16.59 9.41L10.59 15.41Z"
                fill={color}
            />
        </svg>
    );
};

