# Supabase Setup — HomeSharing

> Этот документ описывает текущее состояние интеграции HomeSharing с Supabase: схему БД, политики безопасности, переменные окружения и миграционные скрипты. Документ синхронизирован с продакшн-проектом `HomeSharing` (project_id `kjueqlamopwspdycxice`).

## 1. Архитектура

- Авторизация — **NextAuth v4** (JWT-сессии, провайдеры `credentials` / GitHub / Google). Adapter для Supabase **не используется**, поэтому таблицы `Account`, `Session`, `VerificationToken` лежат пустыми и нужны только для совместимости со старым импортом схемы.
- Данные приложения (объявления, бронирования, избранное) — в **Supabase Postgres**.
- Серверные роуты, которые пишут или читают приватные данные, обращаются к БД через **service role key** (helper `getServiceClient()`). Это умышленно: NextAuth не даёт `auth.uid()`, поэтому RLS-проверки на стороне Postgres не сработали бы.
- Проверка пользователя зависит от типа роута:
  - `loadSession()` используется в роуте owner/host и в большинстве booking/me endpoint'ов
  - `getServerSession(authOptions)` используется, например, в `favorites` и ряде auth-aware route handlers
  - публичные каталожные роуты `GET /api/listings` и `GET /api/listings/[id]` не требуют сессии

```
Client (NextAuth.useSession) ──▶ /api/* (Server Components / Route Handlers)
                                       │
                                       ├── loadSession() / getServerSession() → проверка пользователя/роли
                                       └── getServiceClient() → Supabase service-role
                                                  │
                                                  ▼
                                            public.* tables
```

## 2. Переменные окружения

Минимальный набор в `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kjueqlamopwspdycxice.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # клиент (только публичные операции)
SUPABASE_SERVICE_ROLE_KEY=...        # серверные API; обходит RLS

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# OAuth (опционально)
GITHUB_ID=...
GITHUB_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

> **Важно:** `SUPABASE_SERVICE_ROLE_KEY` нужен для серверных операций с приватными данными. Если он отсутствует, `getServiceClient()` использует анонимный ключ и логирует предупреждение, но многие роуты в этом случае будут работать нестабильно или перестанут проходить по правам.

> Пары OAuth-переменных должны быть полными: либо обе заданы, либо обе отсутствуют. Это валидируется на старте приложения.

### 2.1 Supabase Storage (аватары пользователей)

Для полноценной смены фото профиля нужен bucket:

- Название: `avatars`
- Тип: `public`
- Ограничение файла в UI/API: до 5MB, только `image/*`

API для аватаров:
- `POST /api/me/avatar` — multipart upload (`file`), сохраняет URL в `User.image`
- `DELETE /api/me/avatar` — сбрасывает `User.image` в `null`

## 3. Схема Postgres

Все таблицы находятся в схеме `public`. Везде включён RLS, политики не созданы — доступ на приватные данные идёт через service role.

### 3.1 `User` — учётные записи (NextAuth-совместимая)

| Колонка       | Тип                          | Назначение                                         |
| ------------- | ---------------------------- | -------------------------------------------------- |
| `id`          | `text` PK (uuid string)      | ID пользователя                                    |
| `email`       | `text` UNIQUE NOT NULL       | Email                                              |
| `name`        | `text`                       | Имя для UI                                         |
| `username`    | `text`                       | Никнейм (опционально)                              |
| `password`    | `text`                       | Bcrypt-хэш для credentials-логина                  |
| `image`       | `text`                       | URL аватара                                        |
| `emailVerified` | `timestamptz`              | NextAuth — дата подтверждения email                |
| `isAdmin`     | `boolean` default `false`    | Администратор (для будущего использования)         |
| `isUser`      | `boolean` default `true`     | Активный пользователь                              |
| `isService`   | `boolean` default `false`    | **Роль арендодателя (host)**. Главный флаг ролей   |
| `createdAt`   | `timestamptz` default `now()`|                                                    |
| `updatedAt`   | `timestamptz` default `now()`|                                                    |

**Роли:**
- Базовый пользователь (`isService = false`) — может бронировать объекты.
- Арендодатель (`isService = true`) — дополнительно может публиковать объявления и принимать бронирования.

Изменение роли — через `PATCH /api/me` (страница `/settings`).

### 3.2 `listings` — каталог объявлений

| Колонка               | Тип            | Описание                                                    |
| --------------------- | -------------- | ----------------------------------------------------------- |
| `id`                  | `text` PK      | cuid2 (генерируется на сервере)                             |
| `user_id`             | `text` → `User(id)` ON DELETE SET NULL | Владелец-арендодатель. `null` = seed-данные |
| `title`               | `text` NOT NULL |                                                            |
| `deal_type`           | `text` NOT NULL | `rent_long` \| `rent_short` \| `sale`                       |
| `property_type`       | `text` NOT NULL | `flat` \| `studio` \| `room` \| `house`                     |
| `rooms`               | `integer` NOT NULL |                                                          |
| `area`                | `numeric` NOT NULL | м²                                                       |
| `living_area`         | `numeric`      | м²                                                          |
| `kitchen_area`        | `numeric`      | м²                                                          |
| `floor`               | `integer` NOT NULL |                                                          |
| `total_floors`        | `integer` NOT NULL |                                                          |
| `price`               | `numeric` NOT NULL | Стоимость в рублях                                       |
| `price_period`        | `text`         | `month` \| `day`. NULL для `sale`                           |
| `deposit`             | `numeric`      |                                                             |
| `city`                | `text` NOT NULL |                                                            |
| `district`            | `text`         |                                                             |
| `metro`               | `text`         |                                                             |
| `metro_distance_min`  | `integer`      | минут пешком до метро                                       |
| `latitude`            | `double precision` | WGS84, необязательно (точка на карте)                  |
| `longitude`           | `double precision` | WGS84, необязательно                                   |
| `address`             | `text` NOT NULL |                                                            |
| `description`         | `text` NOT NULL |                                                            |
| `amenities`           | `text[]` default `'{}'` |                                                    |
| `images`              | `text[]` default `'{}'` | URL фотографий                                     |
| `rating`              | `numeric`      | 0..5                                                        |
| `reviews_count`       | `integer`      |                                                             |
| `published_at`        | `timestamptz` default `now()` |                                              |
| `is_verified`         | `boolean` default `false` |                                                  |
| `owner_name`          | `text` NOT NULL | Денормализованное имя владельца / агентства              |
| `owner_avatar`        | `text`         |                                                             |
| `owner_type`          | `text` NOT NULL | `owner` \| `agency`                                         |
| `owner_phone_masked`  | `text`         |                                                             |
| `created_at`          | `timestamptz` default `now()` | trigger `set_updated_at`                     |
| `updated_at`          | `timestamptz` default `now()` |                                              |

**Индексы:** `listings(user_id)`, плюс набор по `city`, `deal_type`, `property_type`, `published_at`, `price` (создаются автоматически Supabase либо ручно при необходимости фильтров).

### 3.3 `bookings` — бронирования

| Колонка        | Тип                                  | Описание                                  |
| -------------- | ------------------------------------ | ----------------------------------------- |
| `id`           | `uuid` PK default `gen_random_uuid()` |                                          |
| `listing_id`   | `text` NOT NULL → `listings(id)` ON DELETE CASCADE | Объект            |
| `guest_id`     | `text` NOT NULL → `User(id)` ON DELETE CASCADE | Гость                  |
| `host_id`      | `text` → `User(id)` ON DELETE SET NULL | Снимок владельца на момент брони        |
| `start_date`   | `date` NOT NULL                      |                                           |
| `end_date`     | `date` NOT NULL                      | CHECK `end_date >= start_date`            |
| `guests_count` | `integer` NOT NULL default `1`       | CHECK `> 0`                               |
| `total_price`  | `numeric` NOT NULL                   | Считается на сервере при создании         |
| `currency`     | `text` NOT NULL default `'RUB'`      |                                           |
| `status`       | `text` NOT NULL default `'pending'`  | `pending`\|`confirmed`\|`cancelled`\|`rejected`\|`completed` |
| `notes`        | `text`                               | Комментарий гостя владельцу               |
| `created_at`   | `timestamptz` default `now()`        |                                           |
| `updated_at`   | `timestamptz` default `now()`        | trigger `set_updated_at`                  |

**Индексы:** `(listing_id)`, `(guest_id)`, `(host_id)`, `(status)`, `(start_date, end_date)`.

**Жизненный цикл статусов:**

```
pending  ──▶ confirmed ──▶ completed
   │            │
   │            └──▶ cancelled
   │
   ├──▶ rejected   (host)
   └──▶ cancelled  (guest или host)
```

- Гость может перевести бронирование только в `cancelled`, и только из `pending`/`confirmed`.
- Арендодатель видит свои бронирования и переключает их по таблице переходов в `src/app/api/host/bookings/[id]/route.ts`.

### 3.4 `favorites` — избранное

| Колонка      | Тип                                  | Описание                              |
| ------------ | ------------------------------------ | ------------------------------------- |
| `user_id`    | `text` PK part → `User(id)`          |                                       |
| `listing_id` | `text` PK part → `listings(id)`      |                                       |
| `created_at` | `timestamptz` default `now()`        |                                       |

Композитный ключ `(user_id, listing_id)` обеспечивает идемпотентность. Клиент держит локальный список (`localStorage`) и синхронизируется с сервером после логина (`favoritesStore.setCurrentUser`).

### 3.5 Прочее

- `Account`, `Session`, `VerificationToken` — пустые таблицы из стартовой схемы NextAuth; оставлены для обратной совместимости. Доступ закрыт RLS (политик нет, доступ только через service role).
- `Flat` — устаревшая таблица «моих квартир» из ранней версии. Поддерживается роутами `/api/flats`, но новые фичи строятся вокруг `listings`.

### 3.6 Триггеры

```sql
create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end$$;

create trigger listings_set_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
```

## 4. RLS

Все таблицы имеют `enable row level security`, но **без явных политик**. Это осознанный выбор: единственный путь к данным — через сервер с service role key, который RLS обходит. Фронтенд напрямую к Supabase не ходит.

> Если в будущем потребуется клиентский доступ (например, реализовать realtime-подписки), необходимо ввести политики на уровне Postgres и переписать соответствующие места на anon-клиент.

## 5. API endpoints

### Публичные

| Метод & путь          | Описание                                   |
| --------------------- | ------------------------------------------ |
| `GET /api/listings`   | Каталог с фильтрами/сортировкой/пагинацией |
| `GET /api/listings/[id]` | Детальная карточка + `similar`         |

### Авторизованный пользователь

| Метод & путь               | Описание                                                  |
| -------------------------- | --------------------------------------------------------- |
| `POST /api/bookings`       | Создать бронирование. Body: `listingId`, `startDate`, `endDate`, `guestsCount?`, `notes?`. Сервер сам считает `total_price` и проверяет пересечение дат |
| `GET  /api/bookings`       | Список своих броней (с краткой информацией об объекте)    |
| `PATCH /api/bookings/[id]` | Отменить (`status: "cancelled"`) — только из `pending`/`confirmed` |
| `GET  /api/favorites`      | Список `listing_id` из избранного для текущего пользователя |
| `POST /api/favorites`      | Добавить в избранное (идемпотентно)                       |
| `DELETE /api/favorites`    | Очистить избранное                                        |
| `DELETE /api/favorites/[listingId]` | Удалить один объект                              |

### Арендодатель (`isService = true`)

| Метод & путь                       | Описание                                          |
| ---------------------------------- | ------------------------------------------------- |
| `GET  /api/host/listings`          | Свои объявления                                   |
| `POST /api/host/listings`          | Создать объявление (валидация в `validateDraft`)  |
| `GET  /api/host/listings/[id]`     | Загрузить своё объявление                         |
| `PUT  /api/host/listings/[id]`     | Полное обновление                                 |
| `DELETE /api/host/listings/[id]`   | Удалить                                           |
| `GET  /api/host/bookings`          | Заявки на ваши объекты                            |
| `PATCH /api/host/bookings/[id]`    | Сменить статус (`confirmed`/`rejected`/`completed`/`cancelled`) — переходы зашиты в роуте |

### Сервисное

| Метод & путь            | Описание                                                       |
| ----------------------- | -------------------------------------------------------------- |
| `PATCH /api/me`         | Body `{ "isHost": boolean }` — переключить роль арендодателя   |
| `POST /api/me/avatar`   | Загрузить новый аватар пользователя                            |
| `DELETE /api/me/avatar` | Удалить текущий аватар пользователя                            |
| `POST /api/signup`      | Регистрация (credentials)                                      |

### Legacy / compatibility

| Метод & путь          | Описание |
| --------------------- | -------- |
| `/api/flats`          | Устаревший слой "моих квартир" из ранней версии |
| `/api/flats/[id]`     | Устаревший слой "моих квартир" из ранней версии |

Не все эндпоинты используют одну и ту же session helper-функцию, но приватные серверные операции в текущем коде сходятся к `next-auth` + `getServiceClient()`.

## 6. Сидинг данных

Скрипт `scripts/seed-listings.mjs` генерирует моковые объявления и заливает их в `public.listings` (`upsert` по `id`).

```bash
node --env-file=.env.local scripts/seed-listings.mjs
```

Скрипт оставляет `user_id = NULL` для seed-объявлений — они отображаются в каталоге, но не «принадлежат» ни одному реальному пользователю и не могут редактироваться через `/host/listings`.

## 7. Чек-лист первой настройки

1. Создать Supabase-проект, скопировать URL и оба ключа в `.env.local`.
2. Импортировать стартовую NextAuth-схему (User/Session/Account/VerificationToken/Flat) — например, через ранний прогон Prisma. Если таблицы уже есть — пропустить.
3. Применить миграцию для `listings` (см. `scripts/seed-listings.mjs` плюс ручная DDL — структура описана в §3.2).
4. Применить миграцию для `bookings`, `favorites`, триггера `set_updated_at` (создаются скриптами из §3.3 / §3.6).
5. Включить RLS на всех таблицах (`alter table ... enable row level security`).
6. Запустить сидинг.
7. `npm run dev` — приложение поднимется на `http://localhost:3000`.

## 8. Подсказки по роли арендодателя

- Чтобы тест-аккаунту дать роль арендодателя без UI: `update public."User" set "isService" = true where email = '...';`.
- `isService = false` снова делает пользователя обычным гостем; страницы `/host/*` начинают показывать gate-сообщение.
- Сессия NextAuth обновляется не сразу; на странице `/settings` после переключения вызывается `update()` из `useSession`.
