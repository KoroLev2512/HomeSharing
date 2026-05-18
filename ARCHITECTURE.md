# Архитектура экспериментального стенда HomeSharing

## Содержание

1. [Общее описание](#общее-описание)
2. [Технологический стек](#технологический-стек)
3. [Структура системы](#структура-системы)
4. [Слои приложения](#слои-приложения)
5. [API и маршрутизация](#api-и-маршрутизация)
6. [Слой данных](#слой-данных)
7. [Аутентификация и авторизация](#аутентификация-и-авторизация)
8. [Событийная архитектура (Outbox)](#событийная-архитектура-outbox)
9. [Кэширование](#кэширование)
10. [Наблюдаемость](#наблюдаемость)
11. [Безопасность и middleware](#безопасность-и-middleware)
12. [Инфраструктура](#инфраструктура)
13. [Ограничения стенда](#ограничения-стенда)

---

## Общее описание

HomeSharing — учебный экспериментальный стенд, реализующий платформу краткосрочной и долгосрочной аренды недвижимости. Цель стенда — отработка high-load паттернов на реалистичной предметной области: объявления, бронирования, оплаты, уведомления, события.

Стенд построен как монолитное Next.js-приложение с элементами event-driven архитектуры — намеренно, чтобы исследовать, где монолит начинает трещать и где разумно выделять сервисы.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Браузер / клиент                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│              Next.js 16 (App Router + Turbopack)                 │
│                                                                  │
│   ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│   │  Pages /   │  │  API Routes  │  │  proxy.ts (middleware)  │ │
│   │  Layouts   │  │  /api/*      │  │  rate limit, headers    │ │
│   └────────────┘  └──────┬───────┘  └─────────────────────────┘ │
└──────────────────────────┼──────────────────────────────────────┘
                           │
          ┌────────────────┼──────────────────┐
          │                │                  │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
   │  Supabase   │  │   Redis 7   │  │  RabbitMQ 3  │
   │ PostgreSQL  │  │   (кэш)     │  │  (очередь)   │
   └─────────────┘  └─────────────┘  └──────────────┘
          │
   ┌──────▼──────────────────────┐
   │  Prometheus  │  Grafana     │
   │  (метрики)   │  (дашборды)  │
   └─────────────────────────────┘
```

---

## Технологический стек

### Frontend

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Фреймворк | Next.js (App Router) | 16.1.1 |
| UI-библиотека | React | 19.2.3 |
| Язык | TypeScript | 5.9.3 |
| Стили | SCSS Modules | — |
| Состояние | Zustand | 5.0.9 |
| Запросы | TanStack React Query | 5.90.16 |
| HTTP-клиент | Axios | 1.13.2 |
| Карты | Яндекс.Карты API 2.1 | — |

### Backend (Next.js API Routes)

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Runtime | Node.js | 20+ |
| ORM/Query Builder | Supabase JS Client | 2.90.0 |
| Auth | NextAuth.js | 4.24.13 |
| Пароли | bcrypt | 6.0.0 |
| JWT | jsonwebtoken | 9.0.3 |
| Логирование | Кастомный JSON-логгер | — |
| Метрики | prom-client (опц.) | — |

### Инфраструктура

| Сервис | Технология | Порт |
|--------|-----------|------|
| База данных | PostgreSQL 16 | 5432 |
| Кэш | Redis 7 | 6379 |
| Брокер сообщений | RabbitMQ 3.13 | 5672 / 15672 |
| Мониторинг | Prometheus 2.52 | 9090 |
| Дашборды | Grafana 10.4 | 3001 |

---

## Структура системы

```
src/
├── app/                    # Next.js App Router
│   ├── (pages)/            # Публичные и защищённые страницы
│   ├── api/                # API Routes (38+ эндпоинтов)
│   ├── error.tsx           # Page-level error boundary
│   └── global-error.tsx    # App-level error boundary
│
├── layouts/                # Page-level layout компоненты
│   ├── Listings/           # Список и детальная страница объявлений
│   ├── Favorites/          # Избранное
│   ├── Bookings/           # Бронирования пользователя
│   ├── Host/               # Кабинет арендодателя
│   ├── Admin/              # Административный раздел
│   └── ...
│
├── widgets/                # Переиспользуемые UI-виджеты
│   ├── BookingForm/        # Форма бронирования (3 режима)
│   ├── ListingCard/        # Карточка объявления
│   ├── ListingFilters/     # Панель фильтров
│   ├── NavigationBar/      # Боковая навигация (auth)
│   ├── YandexMapPicker/    # Пикер адреса на карте
│   ├── MapView/            # Карта (только просмотр)
│   └── ...
│
└── shared/
    ├── lib/                # Бизнес-логика и сервисы
    │   ├── auth.ts         # NextAuth конфигурация
    │   ├── bookingsRepo.ts # Репозиторий бронирований
    │   ├── listingsRepo.ts # Репозиторий объявлений
    │   ├── bookingPricing.ts # Расчёт стоимости
    │   ├── events/         # Доменные события (Outbox)
    │   ├── logger/         # Структурированное логирование
    │   ├── metrics/        # Prometheus-метрики
    │   └── cache/          # Redis Cache-Aside
    ├── types/              # TypeScript типы
    ├── ui/                 # Базовые UI-примитивы
    ├── icons/              # SVG-иконки
    └── utils/supabase/     # Supabase клиенты (browser/server/service)
```

---

## Слои приложения

### 1. Presentation Layer — страницы и виджеты

Страницы живут в `src/app/`, компоненты разделены на три уровня:

- **Layouts** (`src/layouts/`) — отвечают за структуру конкретной страницы, содержат бизнес-логику отображения
- **Widgets** (`src/widgets/`) — самодостаточные UI-блоки, могут сами делать запросы
- **Shared UI** (`src/shared/ui/`) — атомарные компоненты без логики

### 2. API Layer — маршруты Next.js

Каждый API-роут (`src/app/api/`) — это изолированный серверный обработчик. Паттерн:

```
Request → proxy.ts (rate-limit, headers, correlationId)
        → loadSession() (auth guard)
        → validation (zod / manual)
        → Repo / Service
        → EventPublisher (non-fatal, outbox)
        → Response
```

### 3. Data Access Layer — репозитории

Репозитории изолируют работу с Supabase. Используют сервисный клиент (обход RLS) для серверных операций:

```typescript
// Пример паттерна репозитория
class BookingsRepo {
  static async create(input: ICreateBookingInput): Promise<IBooking>
  static async hasOverlap(listingId, startDate, endDate): Promise<boolean>
  static async getBookedRanges(listingId): Promise<Range[]>
  static async setStatus(id, status): Promise<IBooking | null>
}
```

### 4. Event Layer — доменные события

После успешного сохранения данных публикуется событие в outbox-таблицу. Доставка — асинхронная, через воркер.

---

## API и маршрутизация

### Публичные эндпоинты

```
GET  /api/listings                    Список объявлений с фильтрами
GET  /api/listings/[id]               Детальная страница + похожие
GET  /api/listings/[id]/availability  Занятые периоды для объявления
```

### Авторизованные эндпоинты (пользователь)

```
GET  /api/me                          Профиль текущего пользователя
POST /api/me/avatar                   Загрузка аватара
GET  /api/bookings                    Бронирования гостя
POST /api/bookings                    Создание бронирования
GET  /api/favorites                   Избранное
POST /api/favorites/[listingId]       Добавить в избранное
DEL  /api/favorites/[listingId]       Убрать из избранного
```

### Эндпоинты хоста

```
GET  /api/host/listings               Объекты хоста
POST /api/host/listings               Создать объявление
GET  /api/host/bookings               Бронирования хоста
PATCH /api/host/bookings/[id]         Подтвердить / отклонить
POST /api/host/listing-images         Загрузить фотографии
```

### Административные эндпоинты

```
GET  /api/admin/users                 Список пользователей
GET  /api/admin/bookings              Все бронирования
GET  /api/admin/listings              Все объявления
PATCH /api/admin/bookings/[id]        Управление бронированием
```

### Системные эндпоинты

```
GET  /api/health                      Liveness / readiness probe
GET  /api/metrics                     Prometheus-метрики (text/plain)
POST /api/worker/outbox               Cron-воркер: обработка Outbox
```

### Роутинг страниц

| Путь | Доступ | Описание |
|------|--------|----------|
| `/` | Публичный | Главная страница |
| `/listings` | Публичный | Каталог объявлений |
| `/listings/[id]` | Публичный | Страница объявления |
| `/favorites` | Публичный | Избранное (localStorage) |
| `/login`, `/register` | Публичный | Аутентификация |
| `/esia/login` | Публичный | Имитация ЕСИА OAuth |
| `/bookings` | Auth | Мои бронирования |
| `/settings` | Auth | Настройки профиля |
| `/messages` | Auth | Сообщения |
| `/notifications` | Auth | Уведомления |
| `/host/*` | Auth + Host | Кабинет арендодателя |
| `/admin/*` | Auth + Admin | Административный раздел |

---

## Слой данных

### PostgreSQL через Supabase

На стенде используются два режима работы с БД:

**1. Supabase (production-like)**
Облачный PostgreSQL с Row Level Security. Для серверных операций используется сервисный ключ (`SUPABASE_SERVICE_ROLE_KEY`) — обходит RLS. Для браузерных — анонимный ключ + RLS.

**2. Локальный PostgreSQL (Docker)**
Инициализируется скриптом `002_highload_schema.sql`, который создаёт схему с high-load оптимизациями: партиционирование, индексы для временных диапазонов, advisory locks, функция `hs_create_booking`.

```
┌────────────────────────────────────────────────┐
│                PostgreSQL 16                    │
│                                                │
│  listings       bookings       hs_outbox_events │
│  users          favorites      sessions         │
│                                                │
│  pg_stat_statements (мониторинг запросов)      │
│  EXCLUDE USING gist (бронирование без перекр.) │
└────────────────────────────────────────────────┘
```

### Supabase-клиенты

| Клиент | Ключ | Где используется |
|--------|------|-----------------|
| `createBrowserClient` | anon key | Клиентские компоненты |
| `createServerClient` | anon key + cookies | Server Components |
| `getServiceClient` | service role | API Routes (обход RLS) |

### DB-функция `hs_create_booking`

Атомарное создание бронирования с advisory lock + `EXCLUDE`-ограничением на перекрытие дат. Если функция не задеплоена — автоматически включается fallback на application-level проверку в `BookingsRepo.hasOverlap`.

```
supabase.rpc('hs_create_booking', params)
  → PGRST202 (не найдена) → application fallback
  → P0001 (перекрытие)    → 409 Conflict
  → success               → 201 Created
```

---

## Аутентификация и авторизация

### NextAuth.js

Конфигурация в `src/shared/lib/auth.ts`. Поддерживаемые провайдеры:

```
Credentials    → email + bcrypt-пароль
GitHub         → OAuth 2.0
Google         → OAuth 2.0
Mock ESIA      → имитация Госуслуг (включается флагом USE_MOCK_ESIA=true)
```

Mock ESIA реализует стандартный OAuth 2.0 flow:
```
/api/mock-esia/authorize  → GET  форма входа (/esia/login)
/api/mock-esia/grant      → POST выдача кода авторизации
/api/mock-esia/token      → POST обмен кода на токен
/api/mock-esia/userinfo   → GET  данные пользователя
```

### Защита маршрутов (proxy.ts)

```typescript
// Защищённые префиксы
const PROTECTED = ['/host', '/admin', '/settings', '/bookings',
                   '/favorites', '/messages', '/notifications'];

// При отсутствии сессии → redirect /login?callbackUrl=...
```

### Роли пользователей

| Роль | Поле сессии | Доступ |
|------|------------|--------|
| Гость | — | Публичные страницы |
| Пользователь | `isUser: true` | `/bookings`, `/settings`, `/messages` |
| Хост | `isHost: true` | `/host/*` |
| Администратор | `isAdmin: true` | `/admin/*` |

---

## Событийная архитектура (Outbox)

### Доменные события

```typescript
// Типы событий (src/shared/lib/events/types.ts)
'booking.created'       'booking.confirmed'
'booking.cancelled'     'booking.completed'
'payment.completed'     'payment.failed'
'property.created'      'property.updated'
'property.deleted'
'user.registered'       'verification.completed'
'notification.created'
```

### Структура события

```typescript
interface DomainEvent<T> {
  id:             string;          // UUID, идемпотентный ключ
  type:           EventType;
  version:        number;          // эволюция схемы
  aggregateType:  string;          // 'booking' | 'property' | ...
  aggregateId:    string;
  correlationId:  string;          // сквозной трейсинг
  occurredAt:     string;          // ISO 8601
  scheduledAt?:   string;          // отложенная публикация
  payload:        T;
}
```

### Outbox-паттерн

```
API Route
  ├─ BookingsRepo.create()          ← атомарная запись в БД
  └─ EventPublisher.publish()       ← запись в hs_outbox_events (non-fatal)
                                        │
                                        │ (cron каждые N секунд)
                             POST /api/worker/outbox
                                        │
                                        ▼
                                  RabbitMQ Exchange
                               homesharing.events
                                        │
                                    Consumers
                            (email, notifications, analytics)
```

Если таблица `hs_outbox_events` не создана или RabbitMQ недоступен — событие логируется как `warn`, запрос продолжается с `201`.

---

## Кэширование

### Стратегия Cache-Aside (Redis)

```
Client Request
     │
     ▼
Redis HIT? ──YES──► вернуть из кэша (TTL не истёк)
     │
    NO
     │
     ▼
PostgreSQL/Supabase ──► результат ──► SET в Redis ──► вернуть клиенту
```

### Ключи и TTL

| Ключ | TTL | Содержимое |
|------|-----|-----------|
| `listings:{hash}` | 300 с | Список объявлений с фильтрами |
| `property:{id}` | 600 с | Детальная страница объявления |
| `session:{userId}` | 86 400 с | Данные сессии пользователя |
| `search:{hash}` | 120 с | Результаты поиска |
| `booking_slots:{propId}` | 60 с | Занятые периоды |

Redis **опционален** — при недоступности приложение работает без кэша, все запросы идут напрямую в БД.

---

## Наблюдаемость

### Структурированные логи

Все серверные события пишутся в stdout/stderr в JSON-формате:

```json
{
  "timestamp": "2026-05-15T12:00:00.000Z",
  "level": "info",
  "message": "Booking created via fallback path",
  "service": "homesharing-app",
  "env": "development",
  "correlationId": "9515d484-...",
  "userId": "c09f502b-...",
  "bookingId": "b2ec8bdb-..."
}
```

Correlation ID генерируется в `proxy.ts` и сквозно передаётся через `logger.child({ correlationId })`.

### Prometheus-метрики (`/api/metrics`)

```
http_requests_total{method, route, status}     counter
http_request_duration_ms{method, route}        histogram
db_query_duration_ms{operation}                histogram
cache_operations_total{operation: hit|miss}    counter
booking_conflicts_total                        counter  ← должен быть ~0
outbox_events_total{status}                    counter
active_bookings_gauge                          gauge
```

### Grafana

Дашборды провизируются через Docker volumes. Стек: Prometheus → Grafana → алерты.

---

## Безопасность и middleware

`src/proxy.ts` — единственная точка входа для всех запросов.

### Rate Limiting (in-memory sliding window)

| Тип запроса | Лимит |
|-------------|-------|
| Общий | 100 req / мин |
| Write APIs (`/api/bookings`, `/api/host`, `/api/me`) | 30 req / мин |

При превышении — `429 Too Many Requests` с заголовком `Retry-After`.

> В production переменная `RATE_LIMIT_*` должна быть вынесена в Redis для корректной работы при нескольких репликах.

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), interest-cohort=()
Strict-Transport-Security: max-age=63072000; preload  (production only)
```

### Валидация входных данных

API-роуты валидируют входные данные вручную (с переходом на Zod). Пример паттерна:

```typescript
const listingId = typeof b.listingId === 'string' ? b.listingId : '';
if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
if (!isValidDateString(startDate) || !isValidDateString(endDate)) { ... }
```

---

## Инфраструктура

### Docker Compose (локальный стенд)

```yaml
services:
  postgres:   image: postgres:16-alpine    port: 5432
  redis:      image: redis:7-alpine        port: 6379
  rabbitmq:   image: rabbitmq:3.13-mgmt    port: 5672, 15672
  prometheus: image: prom/prometheus:2.52  port: 9090
  grafana:    image: grafana:10.4.2        port: 3001
  app:        (опционально, можно npm run dev)
```

### Docker Compose Production (`docker-compose.prod.yml`)

- `app`: 2 реплики, non-root (uid 1001), 1 CPU / 512 MB
- `postgres`: 2 CPU / 2 GB, логи 100 MB × 3 файла
- `redis`: 512 MB, AOF-persistence
- `rabbitmq`: management UI отключён
- `prometheus`: retention 30d / 10 GB
- Все тома помечены `backup: 'true'`, schedule `0 2 * * *`

### Dockerfile (multi-stage)

```
Stage 1 (builder): npm ci → next build --turbopack
Stage 2 (runner):  next start, non-root user
```

### Переменные окружения

```bash
# NextAuth
NEXTAUTH_URL=                    NEXTAUTH_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=        NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PostgreSQL (локально)
DATABASE_URL=

# Redis (опционально)
REDIS_URL=                       REDIS_TTL_LISTINGS=300

# RabbitMQ (опционально)
RABBITMQ_URL=                    RABBITMQ_EXCHANGE=homesharing.events

# Яндекс.Карты
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=

# Mock ESIA
USE_MOCK_ESIA=true

# Мониторинг
LOG_LEVEL=info
METRICS_ENABLED=true             METRICS_AUTH_TOKEN=

# Cron-воркер
WORKER_SECRET=
```

---

## Ограничения стенда

| Ограничение | Описание |
|-------------|---------|
| **Rate limiting in-memory** | Сбрасывается при рестарте процесса. При масштабировании нужен Redis-backend |
| **Outbox non-fatal** | Если `hs_outbox_events` не создана — события теряются, доставка не гарантирована |
| **RabbitMQ опционален** | Брокер подключается только если `RABBITMQ_URL` задан. Без него очередь не работает |
| **Redis опционален** | Без Redis кэша нет, все запросы идут в БД. Под нагрузкой — узкое место |
| **`hs_create_booking` SQL-функция** | Если функция не задеплоена — fallback без advisory lock, возможен race condition при высоком concurrency |
| **Mock ESIA** | Не соответствует реальному протоколу ЕСИА, только для учебных целей |
| **Prisma schema** | Схема присутствует, но в runtime Supabase JS Client используется напрямую — два источника правды |
