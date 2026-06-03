-- Блок 6: Сообщения и уведомления (§3.2 диплома)

-- Таблица сообщений (чат между арендатором и арендодателем)
CREATE TABLE IF NOT EXISTS messages (
    id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    -- Участники диалога
    sender_id     TEXT        NOT NULL,
    receiver_id   TEXT        NOT NULL,
    -- Привязка к бронированию/объявлению (опционально)
    booking_id    TEXT,
    listing_id    TEXT,
    -- Содержимое
    text          TEXT        NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 2000),
    is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_dialogue  ON messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at);
CREATE INDEX IF NOT EXISTS idx_messages_booking   ON messages (booking_id) WHERE booking_id IS NOT NULL;

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id       TEXT        NOT NULL,
    type          TEXT        NOT NULL,   -- 'booking_confirmed' | 'booking_cancelled' | 'new_message' | 'access_granted' | 'verification_done'
    title         TEXT        NOT NULL,
    body          TEXT,
    link          TEXT,                   -- ссылка на связанный ресурс
    is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);

COMMENT ON TABLE messages IS 'Сообщения между участниками аренды. §3.2 диплома.';
COMMENT ON TABLE notifications IS 'Уведомления платформы. §3.2 диплома.';
