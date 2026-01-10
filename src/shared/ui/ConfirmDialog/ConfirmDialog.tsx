import React from "react";
import { VisibilityOffIcon } from "@/shared/icons";
import styles from "./styles.module.scss";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Да",
    cancelLabel = "Нет",
}: ConfirmDialogProps) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.dialog}>
                <div className={styles.content}>
                    <div className={styles.iconWrapper}>
                        <VisibilityOffIcon width={48} height={48} color="#757575" />
                    </div>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.message}>{message}</p>
                    <div className={styles.buttons}>
                        <button
                            type="button"
                            className={styles.confirmButton}
                            onClick={handleConfirm}
                        >
                            {confirmLabel}
                        </button>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

