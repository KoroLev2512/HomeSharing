-- Блок 1: Аудит-журнал событий аренды (§3.4 диплома)
-- Таблица фиксирует ключевые доменные переходы в рамках процесса аренды.
-- Атрибуты соответствуют Таблице 4 диплома.

CREATE TABLE IF NOT EXISTS rental_event_log (
    id                    TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,

    -- Идентификация события
    event_type            TEXT        NOT NULL,          -- 'booking.created' | 'booking.confirmed' | ...
    aggregate_type        TEXT        NOT NULL,          -- 'booking' | 'listing' | 'user' | 'access'
    aggregate_id          TEXT        NOT NULL,          -- id связанного агрегата

    -- Трассировка (§3.4: trace_id, correlation_id)
    correlation_id        TEXT        NOT NULL,
    trace_id              TEXT,

    -- Участники процесса
    actor_user_id         TEXT,                          -- кто инициировал
    subject_user_id       TEXT,                          -- в отношении кого

    -- Полезная нагрузка
    payload               JSONB       NOT NULL DEFAULT '{}',

    -- Верификационные атрибуты (§3.4, Таблица 4)
    verification_id       TEXT,                          -- если событие связано с проверкой права
    cadastral_number      TEXT,                          -- кадастровый номер объекта
    normalization_status  TEXT,                          -- 'ok' | 'invalid_format' | 'ambiguous'
    interpretation_status TEXT,                          -- 'verified' | 'not_verified' | 'inconclusive' | 'technical_failure' | 'manual_review_required'
    interpretation_reason TEXT,
    requires_manual_review BOOLEAN    DEFAULT FALSE,
    policy_version        TEXT,                          -- версия политики интерпретации

    -- IoT атрибуты (§4.3)
    device_id             TEXT,
    access_scope          TEXT,                          -- 'guest' | 'host' | 'service'

    -- Техническая метаинформация
    source_service        TEXT        NOT NULL DEFAULT 'web-bff',
    occurred_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для быстрой выборки в UI
CREATE INDEX IF NOT EXISTS idx_rel_event_log_aggregate
    ON rental_event_log (aggregate_type, aggregate_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_rel_event_log_actor
    ON rental_event_log (actor_user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_rel_event_log_correlation
    ON rental_event_log (correlation_id);

CREATE INDEX IF NOT EXISTS idx_rel_event_log_type
    ON rental_event_log (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_rel_event_log_verification
    ON rental_event_log (verification_id)
    WHERE verification_id IS NOT NULL;

COMMENT ON TABLE rental_event_log IS
    'Аудит-журнал доменных событий аренды. §3.4 диплома Королёва Ю.А.';
