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
        color: 'blue',
        title: 'Разделять синхронные и асинхронные бизнес-процессы',
        body: 'Критические пользовательские операции — создание бронирования, оплата, аутентификация — выполнять через REST/API Gateway с синхронным ответом. Длительные процессы подтверждения прав собственности, телеметрии и цифрового доступа переводить в событийный контур с использованием RabbitMQ и SAGA-паттернов.',
        detail: 'SAGA обеспечивает компенсируемость каждого шага: если один из участников транзакции недоступен, оркестратор запускает компенсирующие действия и гарантирует итоговую консистентность без блокировок.',
        tags: ['REST / API Gateway', 'RabbitMQ', 'SAGA-паттерн', 'Outbox', 'Async'],
    },
    {
        index: '02',
        color: 'violet',
        title: 'Реализовывать Observability как архитектурное свойство',
        body: 'Применять распределённую трассировку, централизованное логирование, OpenTelemetry и мониторинг межсервисных взаимодействий. Correlation ID инжектировать на входе API Gateway и пробрасывать через все слои — сервисы, очереди, базы данных — для сквозного поиска по логам.',
        detail: 'Observability — не инструмент мониторинга, а свойство системы, проектируемое заранее. Деградация конкретного сервиса и латентность в межсервисных вызовах должны быть видны без ручного инструментирования постфактум.',
        tags: ['OpenTelemetry', 'Jaeger', 'Correlation ID', 'ELK / Loki', 'Prometheus', 'Grafana'],
    },
    {
        index: '03',
        color: 'green',
        title: 'Использовать Polyglot Persistence',
        body: 'PostgreSQL — для транзакционных и юридически значимых данных: договора, сделки, цифровые права, история операций. Redis — для кэширования горячих данных и ускорения доступа. Событийные брокеры — для обработки асинхронных потоков данных и IoT-телеметрии.',
        detail: 'Выбор хранилища должен определяться характером данных и паттерном доступа, а не унификацией ради упрощения инфраструктуры. Смешение всех типов данных в одной БД создаёт конкуренцию ресурсов и неоправданную сложность масштабирования.',
        tags: ['PostgreSQL 16', 'Redis 7', 'RabbitMQ', 'IoT-телеметрия', 'CORS'],
    },
    {
        index: '04',
        color: 'amber',
        title: 'Реализовывать Anti-Corruption Layer в виде отдельного интеграционного слоя',
        body: 'Выделить отдельный интеграционный слой с адаптерами, DTO-моделями, mapperами и трансляторами внешних контрактов ЕСИА и Росреестра. Обеспечить преобразование внешних сущностей, статусов и форматов данных во внутреннюю доменную модель платформы.',
        detail: 'ACL исключает прямую зависимость бизнес-логики от структуры внешних API. Изменение формата ответа Росреестра или версии протокола ЕСИА должно затрагивать только слой трансляции — не доменный код.',
        tags: ['Adapters', 'DTO / Mappers', 'ЕСИА', 'Росреестр', 'Domain Model'],
    },
    {
        index: '05',
        color: 'rose',
        title: 'Разграничивать техническую недоступность внешнего контура и доменный отрицательный результат',
        body: 'Временная недоступность государственных сервисов — ЕСИА и Росреестра — не является юридическим фактом и не должна автоматически транслироваться в отказ арендного процесса. Интерпретационный модуль интеграционного слоя обязан различать техническую ошибку соединения и доменный отрицательный результат: отсутствие права собственности или отклонение аутентификации — события разной правовой природы.',
        detail: 'Статусная модель верификации: verified — право подтверждено; not_verified — право явно отсутствует; inconclusive — данные противоречивы; technical_failure — сетевой сбой, circuit breaker, retry; manual_review_required — процесс переходит к оператору. Только статусы not_verified и not_authorized завершают процесс юридическим отказом.',
        tags: ['Interpretation Engine', 'State Machine', 'Circuit Breaker', 'ЕСИА / Росреестр', 'Resilience'],
    },
] as const;

export default function RecommendationsPage() {
    return (
        <div className={styles.page}>
            <header className={styles.hero}>
                <div className={styles.heroInner}>
                    <span className={styles.badge}>Архитектурные решения</span>
                    <h1 className={styles.heroTitle}>Практические рекомендации</h1>
                    <p className={styles.heroSub}>
                        По созданию высоконагруженной платформы аренды
                    </p>
                </div>
            </header>

            <section className={styles.main}>
                <div className={styles.grid}>
                    {RECOMMENDATIONS.map((rec) => (
                        <article key={rec.index} className={styles.card} data-color={rec.color}>
                            <div className={styles.cardTop}>
                                <span className={styles.cardIndex}>{rec.index}</span>
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

                <div className={styles.outro}>
                    <div className={styles.outroHeader}>
                        <span className={styles.outroLabel}>Итог</span>
                        <h2 className={styles.outroTitle}>Архитектурный синтез</h2>
                    </div>
                    <p className={styles.outroText}>
                        Пять рекомендаций образуют связную архитектуру, верифицированную экспериментально: при нагрузке на поток ЕСИА-аутентификации достигнуты p50&nbsp;≈&nbsp;420&nbsp;мс, p95&nbsp;≈&nbsp;780&nbsp;мс, 99,2% успешных транзакций; брокер сообщений обрабатывал до 3&nbsp;000&nbsp;событий/с; более 98% трасс содержали сквозной correlation id. Каждая рекомендация усиливает остальные: разделение контуров снижает связность, observability делает отказы видимыми, polyglot persistence устраняет конкуренцию за ресурсы хранилища, ACL изолирует домен от нестабильности внешних реестров, а разграничение технических и доменных ошибок обеспечивает юридическую корректность системы под нагрузкой.
                    </p>
                    <div className={styles.principles}>
                        <div className={styles.principle}>
                            <span className={styles.principleNum}>I</span>
                            <p>Каждый компонент должен <strong>отказывать предсказуемо</strong> — с явными границами отказа, компенсирующей транзакцией и сигналом для observability-слоя.</p>
                        </div>
                        <div className={styles.principle}>
                            <span className={styles.principleNum}>II</span>
                            <p>Внешние зависимости не должны <strong>проникать в доменную логику</strong> — только через слой трансляции с версионируемыми контрактами и явными DTO-моделями.</p>
                        </div>
                        <div className={styles.principle}>
                            <span className={styles.principleNum}>III</span>
                            <p>Техническая недоступность не является <strong>юридическим фактом</strong> — система должна отложить решение, а не транслировать сетевую ошибку в отказ права.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className={styles.footer}>
                <p>HomeSharing · Практические рекомендации · Экспериментальный стенд</p>
            </footer>
        </div>
    );
}
