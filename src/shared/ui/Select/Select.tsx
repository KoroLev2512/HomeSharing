"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import styles from './styles.module.scss';

export interface ISelectOption<T extends string = string> {
    value: T;
    label: string;
}

/** Дополнительные className к частям селекта (например, тема формы). */
export interface ISelectPartsClassNames {
    trigger?: string;
    triggerOpen?: string;
    panel?: string;
    option?: string;
    optionActive?: string;
    optionSelected?: string;
    chevron?: string;
    chevronOpen?: string;
}

interface IProps<T extends string = string> {
    value: T;
    onChange: (next: T) => void;
    options: Array<ISelectOption<T>>;
    placeholder?: string;
    /** Префикс, отображаемый перед лейблом выбранной опции в триггере. Например: "Сортировка: ". */
    triggerPrefix?: string;
    className?: string;
    /** Классы для триггера, панели и пунктов (поверх дефолтных). */
    partsClassNames?: ISelectPartsClassNames;
    /** Минимальная ширина панели в пикселях (по умолчанию равна ширине триггера). */
    minPanelWidth?: number;
    disabled?: boolean;
    /** `id` триггера — для связи с `<label htmlFor="…">`. */
    triggerId?: string;
    /** `id` элемента с подписью поля — для `aria-labelledby` на триггере. */
    ariaLabelledBy?: string;
}

export const Select = <T extends string = string>({
    value,
    onChange,
    options,
    placeholder,
    triggerPrefix,
    className,
    partsClassNames,
    minPanelWidth,
    disabled,
    triggerId,
    ariaLabelledBy,
}: IProps<T>): React.JSX.Element => {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);

    const selectedIndex = useMemo(
        () => options.findIndex((o) => o.value === value),
        [options, value],
    );
    const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : '';

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(options.length - 1, i + 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
            } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && activeIndex < options.length) {
                    e.preventDefault();
                    onChange(options[activeIndex].value);
                    setOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, options, activeIndex, onChange]);

    useEffect(() => {
        if (open) {
            setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        }
    }, [open, selectedIndex]);

    useEffect(() => {
        if (!open) return;
        const node = listRef.current?.querySelector<HTMLButtonElement>(
            `[data-index="${activeIndex}"]`,
        );
        node?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open]);

    const handleSelect = (next: T) => {
        onChange(next);
        setOpen(false);
    };

    const triggerLabel = selectedLabel
        ? `${triggerPrefix ?? ''}${selectedLabel}`
        : placeholder ?? '';

    return (
        <div ref={rootRef} className={classNames(styles.root, className)}>
            <button
                type="button"
                id={triggerId}
                className={classNames(
                    styles.trigger,
                    partsClassNames?.trigger,
                    {
                        [styles.triggerOpen]: open,
                        [styles.triggerDisabled]: disabled,
                    },
                    open && partsClassNames?.triggerOpen,
                )}
                onClick={() => !disabled && setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-labelledby={ariaLabelledBy}
                disabled={disabled}
            >
                <span
                    className={classNames(styles.triggerLabel, {
                        [styles.triggerPlaceholder]: !selectedLabel,
                    })}
                >
                    {triggerLabel}
                </span>
                <svg
                    className={classNames(
                        styles.chevron,
                        partsClassNames?.chevron,
                        { [styles.chevronOpen]: open },
                        open && partsClassNames?.chevronOpen,
                    )}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                >
                    <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {open && (
                <div
                    className={classNames(styles.panel, partsClassNames?.panel)}
                    role="listbox"
                    style={minPanelWidth ? { minWidth: minPanelWidth } : undefined}
                >
                    <div ref={listRef} className={styles.list}>
                        {options.map((opt, i) => {
                            const selected = opt.value === value;
                            const active = i === activeIndex;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    data-index={i}
                                    className={classNames(
                                        styles.option,
                                        partsClassNames?.option,
                                        {
                                            [styles.optionSelected]: selected,
                                            [styles.optionActive]: active,
                                        },
                                        selected && partsClassNames?.optionSelected,
                                        active && partsClassNames?.optionActive,
                                    )}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    onClick={() => handleSelect(opt.value)}
                                    role="option"
                                    aria-selected={selected}
                                >
                                    <span className={styles.optionLabel}>{opt.label}</span>
                                    {selected && (
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden
                                        >
                                            <path
                                                d="M5 12l4.5 4.5L19 7"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
