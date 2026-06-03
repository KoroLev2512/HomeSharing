-- Блок 2: Расширенные статусы процесса аренды (§3.1 диплома)
-- Добавляет поля для отслеживания полного жизненного цикла аренды.

ALTER TABLE hs_bookings ADD COLUMN IF NOT EXISTS
    process_status TEXT DEFAULT 'initiated';

ALTER TABLE hs_bookings ADD COLUMN IF NOT EXISTS
    ownership_verified_at TIMESTAMPTZ;

ALTER TABLE hs_bookings ADD COLUMN IF NOT EXISTS
    access_granted_at TIMESTAMPTZ;

ALTER TABLE hs_bookings ADD COLUMN IF NOT EXISTS
    access_revoked_at TIMESTAMPTZ;

ALTER TABLE hs_bookings ADD COLUMN IF NOT EXISTS
    process_correlation_id TEXT;

-- Допустимые значения process_status (§3.1):
-- 'initiated'              — бронирование инициировано
-- 'ownership_pending'      — ожидает верификации права собственности
-- 'ownership_verified'     — право подтверждено
-- 'contract_ready'         — договор готов к подписанию
-- 'payment_pending'        — ожидает оплаты
-- 'access_granted'         — цифровой доступ выдан
-- 'active'                 — активная аренда
-- 'completed'              — завершено
-- 'access_revoked'         — доступ отозван
-- 'cancelled'              — отменено
-- 'rejected'               — отклонено
-- 'failed'                 — ошибка процесса

COMMENT ON COLUMN hs_bookings.process_status IS
    'Расширенный статус процесса аренды. §3.1 диплома Королёва Ю.А.';
