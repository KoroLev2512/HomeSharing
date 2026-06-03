-- Добавляет поля для верификации через Росреестр
-- Выполнить в Supabase → SQL Editor

ALTER TABLE listings ADD COLUMN IF NOT EXISTS cadastral_number      TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rosreestr_status       TEXT    DEFAULT 'pending';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rosreestr_checked_at   TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rosreestr_data         JSONB;

-- Допустимые значения rosreestr_status: 'pending' | 'found' | 'not_found' | 'error'
