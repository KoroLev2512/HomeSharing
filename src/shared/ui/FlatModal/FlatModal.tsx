import React from "react";
import { CloseIcon } from "@/shared/icons";
import styles from "./styles.module.scss";

interface FlatModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const FlatModal = ({
    isOpen,
    onClose,
    children,
}: FlatModalProps) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button 
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    <CloseIcon />
                </button>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
};

