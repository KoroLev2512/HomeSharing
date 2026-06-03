-- Блок 4: IoT — цифровой доступ (§4.3 диплома)

-- Device Registry (реестр устройств)
CREATE TABLE IF NOT EXISTS iot_device (
    id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    listing_id     TEXT        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    owner_user_id  TEXT        NOT NULL,
    name           TEXT        NOT NULL,          -- e.g. "Входная дверь", "Калитка"
    device_type    TEXT        NOT NULL DEFAULT 'smart_lock', -- smart_lock | sensor | gate
    vendor         TEXT,                           -- производитель
    external_id    TEXT,                           -- id устройства у вендора
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    last_seen_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Access Policy (полисы доступа)
CREATE TABLE IF NOT EXISTS access_policy (
    id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id     TEXT        NOT NULL,
    listing_id     TEXT        NOT NULL REFERENCES listings(id),
    device_id      TEXT        REFERENCES iot_device(id),
    guest_user_id  TEXT        NOT NULL,
    access_code    TEXT        NOT NULL,           -- одноразовый/временный код (mock QR)
    valid_from     TIMESTAMPTZ NOT NULL,
    valid_until    TIMESTAMPTZ NOT NULL,
    scope          TEXT        NOT NULL DEFAULT 'guest', -- guest | host | service
    status         TEXT        NOT NULL DEFAULT 'active', -- active | revoked | expired
    granted_by     TEXT        NOT NULL,           -- userId того, кто выдал
    revoked_at     TIMESTAMPTZ,
    revoke_reason  TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Access Event (события доступа — IoT телеметрия)
CREATE TABLE IF NOT EXISTS access_event (
    id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    policy_id      TEXT        REFERENCES access_policy(id),
    device_id      TEXT        REFERENCES iot_device(id),
    event_type     TEXT        NOT NULL,           -- 'access_attempt' | 'access_granted' | 'access_denied' | 'revoked'
    actor_user_id  TEXT,
    result         TEXT,                           -- 'success' | 'failure'
    failure_reason TEXT,
    payload        JSONB       DEFAULT '{}',
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iot_device_listing ON iot_device(listing_id);
CREATE INDEX IF NOT EXISTS idx_access_policy_booking ON access_policy(booking_id);
CREATE INDEX IF NOT EXISTS idx_access_policy_guest ON access_policy(guest_user_id, status);
CREATE INDEX IF NOT EXISTS idx_access_event_policy ON access_event(policy_id, occurred_at DESC);

COMMENT ON TABLE iot_device IS 'Device Registry — реестр IoT-устройств. §4.3 диплома.';
COMMENT ON TABLE access_policy IS 'Access Policy — политики цифрового доступа. §4.3 диплома.';
COMMENT ON TABLE access_event IS 'Access Event — события IoT-доступа. §4.3 диплома.';
