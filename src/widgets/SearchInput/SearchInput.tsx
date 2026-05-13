import classNames from "classnames";
import React, { useState } from "react";
import { CancelIcon, SearchIcon } from "@/shared/icons";
import styles from "./style.module.scss";

export type SearchInputState =
    | "enabled"
    | "focus"
    | "active"
    | "active-typing"
    | "pressed"
    | "disabled";

export type SearchInputSize = "small" | "medium";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    state?: SearchInputState;
    size?: SearchInputSize;
    onClear?: () => void;
    showClearButton?: boolean;
}

export const SearchInput = ({
    ref,
    state = "enabled",
    size = "small",
    onClear,
    showClearButton = true,
    className,
    disabled,
    value,
    onChange,
    onFocus,
    onBlur,
    ...restProps
}: SearchInputProps & { ref?: React.Ref<HTMLInputElement> }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState("");

    const displayValue = value !== undefined ? value : internalValue;
    const hasValue = displayValue !== "" && displayValue != null;

    const isDisabled = disabled || state === "disabled";

    // Определяем фактическое состояние для стилизации
    let actualState = state;
    if (isDisabled) {
        actualState = "disabled";
    } else if (state === "enabled") {
        // Автоматически определяем состояние на основе фокуса и значения
        if (isFocused && hasValue) {
            actualState = "active-typing";
        } else if (isFocused) {
            actualState = "focus";
        } else if (hasValue) {
            actualState = "active";
        }
        // Если нет фокуса и нет значения, остается "enabled"
    }
    // Если state явно задан (не "enabled"), используем его как есть

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const propagateSearchValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (value === undefined) {
            setInternalValue(e.target.value);
        }
        onChange?.(e);
    };

    const handleClear = () => {
        if (value === undefined) {
            setInternalValue("");
        }
        onClear?.();
        // Триггерим событие onChange с пустым значением
        const syntheticEvent = {
            target: { value: "" },
            currentTarget: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
    };

    const showClearBtn = showClearButton && hasValue && !isDisabled && actualState === "active-typing";

    return (
        <div
            className={classNames(
                styles.searchInputWrapper,
                styles[`state-${actualState}`],
                styles[`size-${size}`],
                isDisabled && styles.disabled,
                className
            )}
            data-search-focused={isFocused || undefined}
        >
            <div className={styles.iconLeading}>
                <SearchIcon width={24} height={24} color="#000" />
            </div>

            <input
                ref={ref}
                className={styles.input}
                type="text"
                value={displayValue}
                onChange={propagateSearchValueChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={isDisabled}
                {...restProps}
            />

            {showClearBtn && (
                <button
                    type="button"
                    className={styles.clearButton}
                    onClick={handleClear}
                    aria-label="Очистить"
                >
                    <CancelIcon width={24} height={24} color="#000" />
                </button>
            )}
        </div>
    );
};
