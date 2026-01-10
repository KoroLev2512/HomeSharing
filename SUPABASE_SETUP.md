# Настройка Supabase

## Важно: Порядок выполнения

1. Откройте Supabase Dashboard вашего проекта
2. Перейдите в SQL Editor
3. Выполните SQL запросы **по порядку** (сначала создание таблиц, затем RLS политики)
4. Убедитесь, что все таблицы созданы успешно (проверьте в Table Editor)

## Создание таблиц

**Выполните следующие SQL запросы в SQL Editor вашего Supabase проекта по порядку:**

### Таблица User

```sql
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT,
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" TIMESTAMPTZ,
    password TEXT,
    image TEXT,
    "isAdmin" BOOLEAN DEFAULT false,
    "isUser" BOOLEAN DEFAULT true,
    "isService" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX "User_email_idx" ON "User"(email);
```

### Таблица Account (для OAuth)

```sql
CREATE TABLE "Account" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, "providerAccountId")
);

CREATE INDEX "Account_userId_idx" ON "Account"("userId");
```

### Таблица Session (для NextAuth)

```sql
CREATE TABLE "Session" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");
```

### Таблица VerificationToken

```sql
CREATE TABLE "VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    UNIQUE(identifier, token)
);
```

### Таблица Flat (квартиры)

**Важно**: Выполните этот SQL запрос в SQL Editor вашего Supabase проекта.

```sql
-- Удалить таблицу, если она существует (для пересоздания)
-- ВНИМАНИЕ: Это удалит все данные! Используйте только при первой настройке
-- DROP TABLE IF EXISTS "Flat" CASCADE;

-- Создать таблицу Flat
CREATE TABLE "Flat" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    "imageUrl" TEXT,
    "dateStart" TIMESTAMPTZ,
    "dateEnd" TIMESTAMPTZ,
    "tagFlat" TEXT,
    "tagLock" TEXT,
    "isDisabled" BOOLEAN DEFAULT false,
    "wifiLogin" TEXT,
    "wifiPass" TEXT,
    price TEXT,
    rating REAL DEFAULT 5.0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Создать индекс
CREATE INDEX "Flat_userId_idx" ON "Flat"("userId");
```

**Примечание**: 
- `dateStart` и `dateEnd` сделаны nullable (без NOT NULL), чтобы можно было создавать квартиры без указания дат
- Если таблица уже существует и вы хотите обновить структуру, сначала удалите её командой `DROP TABLE IF EXISTS "Flat" CASCADE;` (это удалит все данные!)

## Настройка Row Level Security (RLS)

Для безопасности рекомендуется настроить RLS политики. Выполните следующие SQL запросы:

```sql
-- Включить RLS для таблицы User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Удалить существующие политики, если они есть (для пересоздания)
DROP POLICY IF EXISTS "Users can view own data" ON "User";
DROP POLICY IF EXISTS "Anonymous can insert users" ON "User";
DROP POLICY IF EXISTS "Users can update own data" ON "User";

-- Политика: пользователи могут видеть только свои данные
CREATE POLICY "Users can view own data" ON "User"
    FOR SELECT USING (auth.uid()::text = id);

-- Политика: анонимные пользователи могут создавать аккаунты (для регистрации)
-- Важно: эта политика разрешает вставку для всех, включая неаутентифицированных пользователей
CREATE POLICY "Anonymous can insert users" ON "User"
    FOR INSERT 
    WITH CHECK (true);

-- Политика: пользователи могут обновлять свои данные
CREATE POLICY "Users can update own data" ON "User"
    FOR UPDATE 
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

-- Включить RLS для таблицы Flat
ALTER TABLE "Flat" ENABLE ROW LEVEL SECURITY;

-- Удалить существующие политики, если они есть
DROP POLICY IF EXISTS "Users can view own flats" ON "Flat";
DROP POLICY IF EXISTS "Users can insert own flats" ON "Flat";
DROP POLICY IF EXISTS "Users can update own flats" ON "Flat";
DROP POLICY IF EXISTS "Users can delete own flats" ON "Flat";

-- Политика: пользователи могут видеть только свои квартиры
CREATE POLICY "Users can view own flats" ON "Flat"
    FOR SELECT USING (auth.uid()::text = "userId");

-- Политика: пользователи могут создавать свои квартиры
CREATE POLICY "Users can insert own flats" ON "Flat"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- Политика: пользователи могут обновлять свои квартиры
CREATE POLICY "Users can update own flats" ON "Flat"
    FOR UPDATE USING (auth.uid()::text = "userId");

-- Политика: пользователи могут удалять свои квартиры
CREATE POLICY "Users can delete own flats" ON "Flat"
    FOR DELETE USING (auth.uid()::text = "userId");
```

**Важно**: 
- Политика `"Anonymous can insert users"` разрешает регистрацию новых пользователей без аутентификации.
- Если регистрация все еще не работает, проверьте, что политика создана правильно в Supabase Dashboard.
- В некоторых случаях может потребоваться использовать Service Role Key для операций регистрации (менее безопасно, но работает гарантированно).

## Переменные окружения

Убедитесь, что в `.env.local` указаны:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-secret-key
```

### Как найти Service Role Key

1. Откройте Supabase Dashboard вашего проекта
2. В левом боковом меню нажмите на **Project Settings** (иконка шестеренки внизу)
3. В открывшемся меню выберите **API**
4. В разделе **Project API keys** вы найдете:
   - **anon** `public` — это ваш `NEXT_PUBLIC_SUPABASE_ANON_KEY` (можно использовать в клиентском коде)
   - **service_role** `secret` — это ваш `SUPABASE_SERVICE_ROLE_KEY` (только для серверного кода!)

5. Нажмите на иконку глаза 👁️ рядом с `service_role` key, чтобы показать ключ
6. Скопируйте ключ и добавьте его в `.env.local` как `SUPABASE_SERVICE_ROLE_KEY`

**Важно**: 
- `SUPABASE_SERVICE_ROLE_KEY` - это **секретный ключ**, который обходит все RLS политики
- Service Role Key используется для серверных операций (регистрация, создание пользователей) и обходит RLS политики
- **НИКОГДА не используйте Service Role Key в клиентском коде!** Только в серверных API routes
- **НЕ коммитьте** `.env.local` в git (он должен быть в `.gitignore`)
- Если `SUPABASE_SERVICE_ROLE_KEY` не указан, будет использован `NEXT_PUBLIC_SUPABASE_ANON_KEY` (но тогда нужна правильная RLS политика)

