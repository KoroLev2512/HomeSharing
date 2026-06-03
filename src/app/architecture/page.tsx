import type { Metadata } from 'next';
import styles from './page.module.scss';

export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Архитектура — HomeSharing',
    description: 'Общее описание архитектуры экспериментального стенда HomeSharing.',
};

const DIAGRAM = `
┌─────────────────────────────────────────────────────────────────────────┐
│                           Браузер / клиент                              │
└───────────────────────────────────┬────────────────────────────────────-┘
                                    │ HTTPS
┌───────────────────────────────────▼─────────────────────────────────────┐
│                             API Gateway                                 │
│       rate limit · JWT-auth · routing · inject correlationId            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│              Next.js 16  (App Router + Turbopack)                       │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐   │
│  │  Pages /     │  │  API Routes  │  │  Anti-Corruption Layer (ACL) │   │
│  │  Layouts     │  │   /api/*     │  │  domain model ↔ DB / infra   │   │
│  └──────────────┘  └──────┬───────┘  └──────────────────────────────┘   │
└──────────────────────────-┼─────────────────────────────────────────────┘
                            │
               ┌────────────▼──────────-───┐
               │     SAGA Orchestrator     │
               │  booking → payment        │
               │  → notification → confirm │
               └────────────┬─────────────-┘
                            │
         ┌──────────────────┼───────────────────┐
         │                  │                   │
  ┌──────▼──────┐    ┌──────▼──────┐   ┌────────▼─────┐
  │ PostgreSQL  │    │   Redis 7   │   │  RabbitMQ 3  │
  │    16       │    │   (кэш)     │   │  (очередь)   │
  └──────┬──────┘    └─────────────┘   └──────────────┘
         │
┌────────▼────────────────────────────────────────────────────────────────-─┐
│  Observability                                                            │
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────-──┐  │
│  │  Prometheus 2.52 │  │  Grafana 10.4    │  │  Distributed Tracing    │  │
│  │  (метрики)       │  │  (дашборды)      │  │  OpenTelemetry / Jaeger │  │
│  └──────────────────┘  └──────────────────┘  │  correlationId header   │  │
│                                               └────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  Centralized Logging                                               │   │
│  │  JSON-логи (correlationId · level · service) → ELK Stack / Loki    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
`.trim();

const FRONTEND = [
    ['Next.js', '16.1 (App Router)'],
    ['React', '19.2'],
    ['TypeScript', '5.9'],
    ['SCSS Modules', '—'],
    ['Zustand', '5.0'],
    ['React Query', '5.90'],
    ['Яндекс.Карты', 'API 2.1'],
];

const BACKEND = [
    ['Runtime', 'Node.js 20+'],
    ['Репозитории', 'bookingsRepo / listingsRepo'],
    ['Auth', 'NextAuth 4.24'],
    ['Пароли', 'bcrypt 6.0'],
    ['JWT', 'jsonwebtoken 9.0'],
    ['Логирование', 'Custom JSON logger'],
    ['Метрики', 'prom-client'],
];

const INFRA = [
    ['PostgreSQL', '16', '5432'],
    ['Redis', '7', '6379'],
    ['RabbitMQ', '3.13', '5672 / 15672'],
    ['Prometheus', '2.52', '9090'],
    ['Grafana', '10.4', '3001'],
];

export default function ArchitecturePage() {
    return (
        <div className={styles.page}>
            {/* ── Hero ────────────────────────────────────────────── */}
            <header className={styles.hero}>
                <div className={styles.heroInner}>
                    <span className={styles.badge}>Экспериментальный стенд</span>
                    <h1 className={styles.heroTitle}>HomeSharing</h1>
                    <p className={styles.heroSub}>Архитектура системы</p>
                </div>
            </header>

            <main className={styles.main}>
                {/* ── Description ─────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Общее описание</h2>
                    <div className={styles.descGrid}>
                        <p className={styles.descText}>
                            HomeSharing — учебный экспериментальный стенд, реализующий платформу
                            краткосрочной и долгосрочной аренды недвижимости. Цель стенда —
                            отработка high-load паттернов на реалистичной предметной области:
                            объявления, бронирования, оплаты, уведомления, события.
                        </p>
                        <p className={styles.descText}>
                            Стенд построен как монолитное Next.js-приложение с элементами
                            event-driven архитектуры — намеренно, чтобы исследовать, где монолит
                            начинает трещать и где разумно выделять сервисы.
                        </p>
                    </div>
                </section>

                {/* ── Diagram ─────────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Схема системы</h2>
                    <div className={styles.terminal}>
                        <div className={styles.terminalBar}>
                            <span className={styles.dot} data-color="red" />
                            <span className={styles.dot} data-color="yellow" />
                            <span className={styles.dot} data-color="green" />
                            <span className={styles.terminalLabel}>architecture.txt</span>
                        </div>
                        <pre className={styles.diagram}>{DIAGRAM}</pre>
                    </div>
                </section>

                {/* ── Stack ───────────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Технологический стек</h2>
                    <div className={styles.stackGrid}>
                        {/* Frontend */}
                        <div className={styles.stackCard}>
                            <h3 className={styles.stackCardTitle}>
                                <span className={styles.stackDot} data-layer="ui" />
                                Frontend
                            </h3>
                            <table className={styles.stackTable}>
                                <tbody>
                                {FRONTEND.map(([name, ver]) => (
                                    <tr key={name}>
                                        <td className={styles.stackName}>{name}</td>
                                        <td className={styles.stackVer}>{ver}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Backend */}
                        <div className={styles.stackCard}>
                            <h3 className={styles.stackCardTitle}>
                                <span className={styles.stackDot} data-layer="api" />
                                Backend
                            </h3>
                            <table className={styles.stackTable}>
                                <tbody>
                                {BACKEND.map(([name, ver]) => (
                                    <tr key={name}>
                                        <td className={styles.stackName}>{name}</td>
                                        <td className={styles.stackVer}>{ver}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Infra */}
                        <div className={styles.stackCard}>
                            <h3 className={styles.stackCardTitle}>
                                <span className={styles.stackDot} data-layer="infra" />
                                Инфраструктура
                            </h3>
                            <table className={styles.stackTable}>
                                <thead>
                                <tr>
                                    <th className={styles.stackTh}>Сервис</th>
                                    <th className={styles.stackTh}>Версия</th>
                                    <th className={styles.stackTh}>Порт</th>
                                </tr>
                                </thead>
                                <tbody>
                                {INFRA.map(([name, ver, port]) => (
                                    <tr key={name}>
                                        <td className={styles.stackName}>{name}</td>
                                        <td className={styles.stackVer}>{ver}</td>
                                        <td className={styles.stackPort}>{port}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ── Goal cards ──────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Исследовательские цели</h2>
                    <div className={styles.goalGrid}>
                        {[
                            {
                                icon: '⚡',
                                title: 'High-load паттерны',
                                text: 'Кэширование Redis, Connection Pool, CQRS-ориентированные репозитории, Rate Limiting на API Gateway.',
                            },
                            {
                                icon: '📨',
                                title: 'Event-driven + SAGA',
                                text: 'Outbox Pattern для гарантированной доставки через RabbitMQ. SAGA-оркестратор для multi-step транзакций: booking → payment → notification → confirm.',
                            },
                            {
                                icon: '🛡️',
                                title: 'Anti-Corruption Layer',
                                text: 'ACL изолирует доменную модель от деталей инфраструктуры: репозитории переводят DB-строки в доменные объекты, защищая бизнес-логику от изменений схемы.',
                            },
                            {
                                icon: '🔍',
                                title: 'Распределённая трассировка',
                                text: 'correlationId инжектируется на API Gateway и пробрасывается через все слои — API Routes, репозитории, очередь. OpenTelemetry → Jaeger для сквозного trace.',
                            },
                            {
                                icon: '📋',
                                title: 'Централизованное логирование',
                                text: 'Структурированные JSON-логи с correlationId, level, service. Агрегация в ELK Stack или Grafana Loki. Единый поиск по всем сервисам.',
                            },
                            {
                                icon: '🔐',
                                title: 'Безопасность',
                                text: 'NextAuth (credentials + OAuth), JWT-auth на API Gateway, RLS в PostgreSQL, CSP-заголовки, защита от перебора.',
                            },
                        ].map(({ icon, title, text }) => (
                            <div key={title} className={styles.goalCard}>
                                <span className={styles.goalIcon}>{icon}</span>
                                <h4 className={styles.goalTitle}>{title}</h4>
                                <p className={styles.goalText}>{text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <p>HomeSharing · Экспериментальный стенд · Next.js 16 + PostgreSQL + Redis + RabbitMQ</p>
            </footer>
        </div>
    );
}
