import type { Metadata } from 'next';
import styles from './page.module.scss';

export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Рекомендации — HomeSharing',
    description: 'Практические рекомендации по созданию высоконагруженной платформы аренды.',
};

const RECOMMENDATIONS = [
    {
        index: '01',
        icon: '⚡',
        color: 'blue',
        title: 'Разделять синхронные и асинхронные бизнес-процессы',
        body: 'Критические пользовательские операции — создание бронирования, оплата, аутентификация — выполнять через REST/API Gateway с синхронным ответом. Длительные процессы подтверждения прав собственности, телеметрии и цифрового доступа переводить в событийный контур с использованием RabbitMQ и SAGA-паттернов.',
        detail: 'SAGA обеспечивает компенсируемость каждого шага: если один из участников транзакции недоступен, оркестратор запускает компенсирующие действия и гарантирует итоговую консистентность без блокировок.',
        tags: ['REST / API Gateway', 'RabbitMQ', 'SAGA-паттерн', 'Outbox', 'Async'],
    },
    {
        index: '02',
        icon: '🔍',
        color: 'violet',
        title: 'Реализовывать Observability как архитектурное свойство',
        body: 'Применять распределённую трассировку, централизованное логирование, OpenTelemetry и мониторинг межсервисных взаимодействий. Correlation ID инжектировать на входе API Gateway и пробрасывать через все слои — сервисы, очереди, базы данных — для сквозного поиска по логам.',
        detail: 'Observability — не инструмент мониторинга, а свойство системы, проектируемое заранее. Деградация конкретного сервиса и латентность в межсервисных вызовах должны быть видны без ручного инструментирования постфактум.',
        tags: ['OpenTelemetry', 'Jaeger', 'Correlation ID', 'ELK / Loki', 'Prometheus', 'Grafana'],
    },
    {
        index: '03',
        icon: '🗄️',
        color: 'green',
        title: 'Использовать Polyglot Persistence',
        body: 'PostgreSQL — для транзакционных и юридически значимых данных: договора, сделки, цифровые права, история операций. Redis — для кэширования горячих данных и ускорения доступа. Событийные брокеры — для обработки асинхронных потоков данных и IoT-телеметрии.',
        detail: 'Выбор хранилища должен определяться характером данных и паттерном доступа, а не унификацией ради упрощения инфраструктуры. Смешение всех типов данных в одной БД создаёт конкуренцию ресурсов и неоправданную сложность масштабирования.',
        tags: ['PostgreSQL 16', 'Redis 7', 'RabbitMQ', 'IoT-телеметрия', 'CQRS'],
    },
    {
        index: '04',
        icon: '🛡️',
        color: 'amber',
        title: 'Реализовывать anti-corruption layer в виде отдельного интеграционного слоя с адаптерами',
        body: 'Выделить отдельный интеграционный слой с адаптерами, DTO-моделями, маpperами и трансляторами внешних контрактов ЕСИА и Росреестра. Обеспечить преобразование внешних сущностей, статусов и форматов данных во внутреннюю доменную модель платформы.',
        detail: 'ACL исключает прямую зависимость бизнес-логики от структуры внешних API. Изменение формата ответа Росреестра или версии протокола ЕСИА должно затрагивать только слой трансляции — не доменный код.',
        tags: ['Adapters', 'DTO / Mappers', 'ЕСИА', 'Росреестр', 'Domain Model'],
    },
] as const;

export default function RecommendationsPage() {
    return (
        <div className={styles.page}>
            {/* ── Hero ─────────────────────────────────────────── */}
            <header className={styles.hero}>
                <div className={styles.heroInner}>
                    <span className={styles.badge}>Архитектурные решения</span>
                    <h1 className={styles.heroTitle}>Практические рекомендации</h1>
                    <p className={styles.heroSub}>
                        По созданию высоконагруженной платформы аренды
                    </p>
                </div>
            </header>

            {/* ── Cards ────────────────────────────────────────── */}
            <main className={styles.main}>
                <div className={styles.grid}>
                    {RECOMMENDATIONS.map((rec) => (
                        <article key={rec.index} className={styles.card} data-color={rec.color}>
                            <div className={styles.cardTop}>
                                <span className={styles.cardIndex}>{rec.index}</span>
                                <span className={styles.cardIcon}>{rec.icon}</span>
                            </div>
                            <h2 className={styles.cardTitle}>{rec.title}</h2>
                            <p className={styles.cardBody}>{rec.body}</p>
                            <p className={styles.cardDetail}>{rec.detail}</p>
                            <div className={styles.tagRow}>
                                {rec.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </main>

            <footer className={styles.footer}>
                <p>HomeSharing · Практические рекомендации · Экспериментальный стенд</p>
            </footer>
        </div>
    );
}
