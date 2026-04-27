"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import styles from './citySelect.module.scss';

interface IProps {
    value: string | undefined;
    onChange: (city: string | undefined) => void;
    cities: string[];
    placeholder?: string;
    allLabel?: string;
    className?: string;
}

export const CitySelect: React.FC<IProps> = ({
    value,
    onChange,
    cities,
    placeholder = 'Поиск города',
    allLabel = 'Все города',
    className,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);

    const options = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q
            ? cities.filter((c) => c.toLowerCase().includes(q))
            : cities;
        return [{ value: '', label: allLabel }, ...list.map((c) => ({ value: c, label: c }))];
    }, [cities, search, allLabel]);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
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
                    const opt = options[activeIndex];
                    onChange(opt.value || undefined);
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
            setSearch('');
            setActiveIndex(value ? Math.max(0, options.findIndex((o) => o.value === value)) : 0);
            // фокус на инпут после открытия
            setTimeout(() => inputRef.current?.focus(), 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const node = listRef.current?.querySelector<HTMLButtonElement>(
            `[data-index="${activeIndex}"]`,
        );
        node?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open]);

    const handleSelect = (optValue: string) => {
        onChange(optValue || undefined);
        setOpen(false);
    };

    const displayLabel = value || allLabel;

    return (
        <div ref={rootRef} className={classNames(styles.root, className)}>
            <button
                type="button"
                className={classNames(styles.trigger, { [styles.triggerOpen]: open })}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={classNames(styles.triggerLabel, { [styles.triggerPlaceholder]: !value })}>
                    {displayLabel}
                </span>
                <svg
                    className={classNames(styles.chevron, { [styles.chevronOpen]: open })}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div className={styles.panel} role="listbox">
                    <div className={styles.searchWrap}>
                        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.searchInput}
                            placeholder={placeholder}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setActiveIndex(0);
                            }}
                        />
                    </div>

                    <div ref={listRef} className={styles.list}>
                        {options.length === 0 ? (
                            <div className={styles.empty}>Ничего не найдено</div>
                        ) : (
                            options.map((opt, i) => {
                                const selected = (opt.value || '') === (value || '');
                                const active = i === activeIndex;
                                return (
                                    <button
                                        key={opt.value || '__all__'}
                                        type="button"
                                        data-index={i}
                                        className={classNames(styles.option, {
                                            [styles.optionSelected]: selected,
                                            [styles.optionActive]: active,
                                        })}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        onClick={() => handleSelect(opt.value)}
                                        role="option"
                                        aria-selected={selected}
                                    >
                                        <span className={styles.optionLabel}>{opt.label}</span>
                                        {selected && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
