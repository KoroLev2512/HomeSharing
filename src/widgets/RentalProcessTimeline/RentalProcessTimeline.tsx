"use client";

import React from 'react';
import {
    type RentalProcessStatus,
    PROCESS_STATUS_LABEL,
    PROCESS_TIMELINE,
} from '@/shared/types/booking';
import styles from './styles.module.scss';

interface Props {
    currentStatus: RentalProcessStatus;
    ownershipVerifiedAt?: string | null;
    accessGrantedAt?: string | null;
    accessRevokedAt?: string | null;
}

function fmt(iso?: string | null): string {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
}

const TERMINAL: RentalProcessStatus[] = ['completed', 'cancelled', 'rejected', 'failed', 'access_revoked'];

export const RentalProcessTimeline: React.FC<Props> = ({
    currentStatus,
    ownershipVerifiedAt,
    accessGrantedAt,
    accessRevokedAt,
}) => {
    const isTerminalError = ['cancelled', 'rejected', 'failed'].includes(currentStatus);
    const isAccessRevoked = currentStatus === 'access_revoked';

    const currentIdx = PROCESS_TIMELINE.indexOf(currentStatus);
    const effectiveIdx = currentIdx >= 0 ? currentIdx : (TERMINAL.includes(currentStatus) ? PROCESS_TIMELINE.length : -1);

    return (
        <div className={styles.wrapper}>
            <p className={styles.label}>Этапы процесса аренды <span className={styles.ref}>(§3.1 диплома)</span></p>

            {(isTerminalError || isAccessRevoked) && (
                <div className={styles.terminalBadge} data-danger={isTerminalError || undefined}>
                    {PROCESS_STATUS_LABEL[currentStatus]}
                </div>
            )}

            <div className={styles.timeline}>
                {PROCESS_TIMELINE.map((step, idx) => {
                    const isDone    = idx < effectiveIdx;
                    const isCurrent = idx === effectiveIdx && !isTerminalError && !isAccessRevoked;
                    const isPending = idx > effectiveIdx || isTerminalError;

                    let subtitle: string | undefined;
                    if (step === 'ownership_verified' && ownershipVerifiedAt) subtitle = fmt(ownershipVerifiedAt);
                    if (step === 'access_granted' && accessGrantedAt) subtitle = fmt(accessGrantedAt);
                    if (step === 'access_revoked' && accessRevokedAt) subtitle = fmt(accessRevokedAt);

                    return (
                        <div
                            key={step}
                            className={styles.step}
                            data-done={isDone || undefined}
                            data-current={isCurrent || undefined}
                            data-pending={isPending || undefined}
                        >
                            <div className={styles.dot}>
                                {isDone ? (
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                ) : isCurrent ? (
                                    <div className={styles.dotPulse} />
                                ) : null}
                            </div>
                            {idx < PROCESS_TIMELINE.length - 1 && (
                                <div className={styles.line} data-done={isDone || undefined} />
                            )}
                            <div className={styles.stepLabel}>
                                {PROCESS_STATUS_LABEL[step]}
                                {subtitle && <span className={styles.stepSub}>{subtitle}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
