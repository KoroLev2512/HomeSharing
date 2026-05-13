import classNames from "classnames";
import React, { useState } from "react";
import { CancelIcon, CheckCircleIcon, ErrorIcon, VisibilityIcon, VisibilityOffIcon } from "@/shared/icons";
import styles from "./style.module.scss";

export type InputState = 
    | "enabled" 
    | "focus" 
    | "active" 
    | "active-typing" 
    | "error" 
    | "success" 
    | "incomplete" 
    | "complete" 
    | "pressed" 
    | "readonly" 
    | "disabled";

export type InputSize = "small" | "medium";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    label?: string;
    hint?: string;
    state?: InputState;
    size?: InputSize;
    iconLeading?: React.ReactNode;
    iconTrailing?: React.ReactNode;
    showClearButton?: boolean;
    showPasswordToggle?: boolean;
    onClear?: () => void;
    errorMessage?: string;
    successMessage?: string;
}

export const Input = ({
    ref,
    label,
    hint,
    state = "enabled",
    size = "medium",
    iconLeading,
    iconTrailing,
    showClearButton = false,
    showPasswordToggle = false,
    onClear,
    errorMessage,
    successMessage,
    className,
    disabled,
    value,
    type,
    onChange,
    onFocus,
    onBlur,
    ...restProps
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const displayValue = value !== undefined ? value : internalValue;
    const hasValue = displayValue !== "" && displayValue != null;
    const isPassword = type === "password";

    const isDisabled = disabled || state === "disabled";
    const isReadOnly = state === "readonly";
    
    // Определяем фактическое состояние для стилизации
    let actualState = state;
    if (isDisabled) {
        actualState = "disabled";
    } else if (isReadOnly) {
        actualState = "readonly";
    } else if (state === "enabled" && isFocused && hasValue) {
        actualState = "active";
    } else if (state === "enabled" && isFocused) {
        actualState = "focus";
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const propagateInputChangeFromEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const showHint = hint || errorMessage || successMessage;
    const hintText = errorMessage || successMessage || hint;
    const hintState = errorMessage ? "error" : successMessage ? "success" : undefined;

    const showClearBtn = showClearButton && hasValue && !isDisabled && !isReadOnly && !isPassword;
    const showPasswordBtn = showPasswordToggle && isPassword && !isDisabled && !isReadOnly;
    
    // Определяем тип для password
    const inputType = isPassword && showPassword ? "text" : type;

    return (
        <div
            className={classNames(
                styles.container,
                isDisabled && styles.disabled,
                className
            )}
            data-input-focused={isFocused ? "" : undefined}
        >
            {label && (
                <label className={styles.label}>
                    {label}
                </label>
            )}
            
            <div
                className={classNames(
                    styles.inputWrapper,
                    styles[`state-${actualState}`],
                    styles[`size-${size}`]
                )}
            >
                {iconLeading && (
                    <div className={styles.iconLeading}>
                        {iconLeading}
                    </div>
                )}
                
                <input
                    ref={ref}
                    className={styles.input}
                    type={inputType}
                    value={displayValue}
                    onChange={propagateInputChangeFromEvent}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    {...restProps}
                />

                {showClearBtn && (
                    <button
                        type="button"
                        className={styles.clearButton}
                        onClick={handleClear}
                        aria-label="Очистить"
                    >
                        <CancelIcon width={24} height={24} />
                    </button>
                )}

                {showPasswordBtn && (
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                        {showPassword ? (
                            <VisibilityOffIcon width={24} height={24} />
                        ) : (
                            <VisibilityIcon width={24} height={24} />
                        )}
                    </button>
                )}

                {state === "error" && (
                    <div className={styles.iconTrailing}>
                        <ErrorIcon width={24} height={24} color="#D44333" />
                    </div>
                )}

                {state === "success" && (
                    <div className={styles.iconTrailing}>
                        <CheckCircleIcon width={24} height={24} color="#3AA76D" />
                    </div>
                )}

                {state === "incomplete" && (
                    <div className={styles.iconTrailing}>
                        <ErrorIcon width={24} height={24} color="#D44333" />
                    </div>
                )}

                {state === "complete" && (
                    <div className={styles.iconTrailing}>
                        <CheckCircleIcon width={24} height={24} color="#3AA76D" />
                    </div>
                )}

                {iconTrailing && 
                    state !== "error" && 
                    state !== "success" && 
                    state !== "incomplete" && 
                    state !== "complete" && (
                        <div className={styles.iconTrailing}>
                            {iconTrailing}
                        </div>
                    )}
            </div>

            {showHint && (
                <div className={classNames(
                    styles.hint,
                    hintState && styles[`hint-${hintState}`]
                )}>
                    {hintState === "error" && (
                        <ErrorIcon width={20} height={20} color="#D44333" />
                    )}
                    {hintState === "success" && (
                        <CheckCircleIcon width={20} height={20} color="#3AA76D" />
                    )}
                    <span>{hintText}</span>
                </div>
            )}
        </div>
    );
};
