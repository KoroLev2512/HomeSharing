import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './not-found.module.scss';

export const metadata: Metadata = { title: '404 — HomeSharing' };

function HouseIllustration() {
    return (
        <svg
            width="260"
            height="220"
            viewBox="0 0 260 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            {/* Stars */}
            <circle className={styles.star1} cx="28"  cy="28"  r="2.5" fill="#FFE074" />
            <circle className={styles.star2} cx="210" cy="18"  r="2"   fill="#FFE074" />
            <circle className={styles.star3} cx="238" cy="44"  r="1.5" fill="#FFE074" />
            <circle className={styles.star4} cx="50"  cy="52"  r="1.5" fill="#FFE074" />

            {/* Moon */}
            <circle cx="224" cy="32" r="18" fill="#FFF9E6" />
            <circle cx="232" cy="26" r="13" fill="#f5f8f9" />

            {/* Ground */}
            <rect x="20" y="196" width="220" height="5" rx="2.5" fill="#E2E2E2" />

            {/* Left tree trunk + crown */}
            <rect x="34"  y="160" width="8"  height="36" rx="4"  fill="#A0856A" />
            <ellipse cx="38"  cy="150" rx="20" ry="24" fill="#5BAD6F" />
            <ellipse cx="38"  cy="142" rx="14" ry="16" fill="#6DC280" />

            {/* Right tree */}
            <rect x="214" y="168" width="7"  height="28" rx="3.5" fill="#A0856A" />
            <ellipse cx="217" cy="158" rx="16" ry="20" fill="#5BAD6F" />
            <ellipse cx="217" cy="151" rx="11" ry="13" fill="#6DC280" />

            {/* House body */}
            <rect x="68" y="126" width="124" height="74" rx="5" fill="#F7F2EA" />
            <rect x="68" y="126" width="124" height="74" rx="5"
                  stroke="#DDD3C0" strokeWidth="1.5" />

            {/* Chimney */}
            <rect x="148" y="76" width="18" height="44" rx="4" fill="#C87C62" />
            <rect x="144" y="72" width="26" height="8"  rx="4" fill="#B56E57" />

            {/* Smoke puffs */}
            <ellipse className={styles.smoke}  cx="157" cy="66" rx="5" ry="4" fill="#D9D9D9" opacity="0.7" />
            <ellipse className={styles.smoke2} cx="160" cy="58" rx="4" ry="3" fill="#D9D9D9" opacity="0.5" />

            {/* Roof */}
            <polygon points="56,128 130,68 204,128" fill="#C87C62" />
            <polygon points="56,128 130,68 204,128"
                     stroke="#B56E57" strokeWidth="1.5" fill="none" />
            {/* Ridge cap */}
            <ellipse cx="130" cy="68" rx="7" ry="5" fill="#B56E57" />

            {/* Door */}
            <rect x="106" y="152" width="48" height="48" rx="24 24 4 4" fill="#8B6F52" />
            <rect x="106" y="152" width="48" height="26" rx="24 24 0 0" fill="#7A6048" />
            {/* Door knob */}
            <circle cx="146" cy="178" r="3.5" fill="#E6B840" />
            <circle cx="146" cy="178" r="1.5" fill="#C9A030" />

            {/* Left window */}
            <rect x="76" y="138" width="28" height="24" rx="4"
                  fill="#FFEEA3" stroke="#DDD3C0" strokeWidth="1" />
            {/* window cross */}
            <line x1="90"  y1="138" x2="90"  y2="162" stroke="#DDD3C0" strokeWidth="1" />
            <line x1="76"  y1="150" x2="104" y2="150" stroke="#DDD3C0" strokeWidth="1" />
            {/* window glow */}
            <rect x="77" y="139" width="12" height="10" rx="2" fill="#FFD84D" opacity="0.4" />

            {/* Right window */}
            <rect x="156" y="138" width="28" height="24" rx="4"
                  fill="#FFEEA3" stroke="#DDD3C0" strokeWidth="1" />
            <line x1="170" y1="138" x2="170" y2="162" stroke="#DDD3C0" strokeWidth="1" />
            <line x1="156" y1="150" x2="184" y2="150" stroke="#DDD3C0" strokeWidth="1" />
            <rect x="157" y="139" width="12" height="10" rx="2" fill="#FFD84D" opacity="0.4" />

            {/* Path */}
            <path d="M110 200 Q100 200 88 200 Q76 200 66 200"
                  stroke="#DDD3C0" strokeWidth="3" strokeLinecap="round" />
            <path d="M150 200 Q162 200 174 200 Q186 200 194 200"
                  stroke="#DDD3C0" strokeWidth="3" strokeLinecap="round" />

            {/* Question mark on door glass */}
            <text x="130" y="148" textAnchor="middle" fontSize="14" fontWeight="700"
                  fill="#fff" opacity="0.55" fontFamily="Inter, sans-serif">?</text>
        </svg>
    );
}

export default function NotFound() {
    return (
        <div className={styles.root}>
            <div className={styles.scene}>
                <HouseIllustration />
            </div>

            <p className={styles.codeRow}>
                <span className={styles.digit}>404</span>
            </p>

            <h1 className={styles.title}>Страница не найдена</h1>
            <p className={styles.description}>
                Кажется, этот адрес пустует. Возможно, ссылка устарела
                или объявление было удалено.
            </p>

            <div className={styles.actions}>
                <Link href="/listings" className={styles.primaryBtn}>
                    На главную
                </Link>
                <Link href="/listings" className={styles.secondaryBtn}>
                    Смотреть объявления
                </Link>
            </div>
        </div>
    );
}
