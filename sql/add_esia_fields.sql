-- Блок 5: Поля верификации ЕСИА (§4.1 диплома)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS esia_sub TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS esia_verified_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_esia_sub ON "User" (esia_sub) WHERE esia_sub IS NOT NULL;

COMMENT ON COLUMN "User".esia_sub IS
    'Внешний идентификатор пользователя в ЕСИА (subject). §4.1 диплома.';
COMMENT ON COLUMN "User".esia_verified_at IS
    'Время подтверждения цифровой личности через ЕСИА. §4.1 диплома.';
