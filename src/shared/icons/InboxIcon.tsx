import React from "react";
import { BLACK_COLOR } from "@/shared/const/colors";
import { IconProps } from "./types";

export const InboxIcon = ({
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
                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 13H15.59C15.21 14.19 14.22 15 13 15C11.78 15 10.79 14.19 10.41 13H7V11H10.41C10.79 9.81 11.78 9 13 9C14.22 9 15.21 9.81 15.59 11H17V13Z"
                fill={color}
            />
        </svg>
    );
};

