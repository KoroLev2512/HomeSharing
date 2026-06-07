# HomeSharing

Прототип веб-платформы автоматизации аренды недвижимости с интеграцией государственных систем идентификации (ЕСИА), Росреестра и IoT-устройств. Разработан в рамках дипломного исследования "Исследование архитектурных и программных решений веб-платформы автоматизации процессов аренды недвижимости с интеграцией ЕСИА, сервисов осреестра и IoT-устройств" (Королёв Ю.А.)

## Функциональность

### Публичная зона
- `/listings` — каталог объявлений: поиск, фильтры, сортировка, карта (Яндекс.Карты), пагинация
- `/listings/[id]` — карточка объявления с галереей и формой бронирования
- `/favorites` — избранные объявления
- `/architecture` — диаграмма архитектуры платформы (§3.1 диплома)
- `/recommendations` — практические рекомендации по проектированию

### Аутентификация
- Вход по email/паролю
- OAuth: Google, GitHub (при наличии env-переменных)
- ЕСИА — мок Госуслуг (OIDC/OAuth 2.0, §4.1 диплома)
- Сброс и смена пароля (Nodemailer)

### Кабинет арендатора
- `/bookings` — мои бронирования со state machine (§3.1) и timeline-компонентом
- `/bookings/[id]/access` — цифровой ключ (QR-код, код доступа, временное окно, §4.3)
- `/messages` — сообщения с арендодателем
- `/notifications` — уведомления платформы
- `/settings` — профиль, смена пароля, роль хоста, статус ЕСИА-верификации

### Кабинет арендодателя (`/host`)
- `/host/listings` — управление объявлениями (CRUD, фото)
- `/host/listings/new` и `/host/listings/[id]/edit` — форма объявления с картой
- `/host/listings/[id]/verify` — верификация права собственности через Росреестр (§4.2)
- `/host/bookings` — входящие заявки: подтверждение, отклонение, завершение

### Панель администратора (`/admin`)
- `/admin/users` — список пользователей, управление ролями
- `/admin/listings` — объявления с inline-верификацией через Росреестр
- `/admin/bookings` — все бронирования, управление статусами
- `/admin/events` — **аудит-журнал событий аренды** (§3.4 диплома)

## Стек

| Слой | Технология |
|---|---|
| Frontend + BFF | Next.js 16, React 19, TypeScript, SCSS Modules |
| Аутентификация | next-auth v4 (JWT), ESIA mock (OIDC) |
| База данных | Supabase PostgreSQL |
| Кэш / сессии | Redis (опционально) |
| Событийная шина | RabbitMQ (опционально, через amqplib) |
| Карты | Яндекс.Карты API |
| Email | Nodemailer |
| Стор | Zustand (минимально, для темы/sidebar) |

## Архитектура

Платформа реализует событийно-ориентированную архитектуру, описанную в дипломной работе:

- **BFF (Backend for Frontend)** — Next.js App Router выступает единой точкой входа для пользовательского интерфейса
- **Domain Events** — ключевые переходы состояний фиксируются в `rental_event_log` (аудит-журнал) и опционально публикуются в RabbitMQ через Outbox-паттерн
- **Интеграция с Росреестром** — anti-corruption layer с нормализацией кадастровых номеров и Interpretation Engine (5 статусов: verified / not_verified / inconclusive / technical_failure / manual_review_required)
- **Интеграция с ЕСИА** — OIDC-поток с обработкой state/nonce, валидацией JWKS, записью события `user.esia_verified`
- **IoT-доступ** — Device Registry, Access Policy Manager, цифровой ключ с QR для подтверждённых бронирований (§4.3)
- **State machine аренды** — расширенные статусы процесса: `initiated → ownership_pending → ownership_verified → contract_ready → payment_pending → access_granted → active → completed`

Интерактивная диаграмма доступна на странице `/architecture` запущенного приложения. Подробная документация — в [ARCHITECTURE.md](ARCHITECTURE.md).

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните значения.

### Обязательные

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### Карты

```env
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=""
```

### ЕСИА (мок Госуслуг)

```env
ESIA_MOCK_ENABLED="true"
```

### OAuth-провайдеры (опционально)

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

GITHUB_ID=""
GITHUB_SECRET=""
```

> Укажите оба значения для провайдера или оставьте оба пустыми.

### Email / сброс пароля

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@homesharing.ru"
```

### Redis (кэш, опционально)

```env
REDIS_URL=""
```

### RabbitMQ (событийная шина, опционально)

```env
RABBITMQ_URL=""
RABBITMQ_EXCHANGE="homesharing.events"
```

## Локальный запуск

```bash
# 1. Зависимости
npm install

# 2. Создать .env.local из примера
cp .env.example .env.local
# Заполнить обязательные переменные

# 3. Запустить миграции в Supabase (см. раздел ниже)

# 4. Запустить dev-сервер
npm run dev

# Открыть http://localhost:3000
```

Гостевой сценарий начинается с `/listings`.  
Авторизованные пользователи попадают на `/` (дашборд).

## Миграции базы данных

Выполните SQL-файлы из директории `sql/` в Supabase → SQL Editor в указанном порядке:

| Файл | Описание |
|---|---|
| `sql/add_rosreestr_fields.sql` | Поля верификации через Росреестр в таблице listings |
| `sql/create_rental_event_log.sql` | Аудит-журнал событий аренды (§3.4) |
| `sql/add_rental_process_status.sql` | Расширенные статусы процесса аренды (§3.1) |
| `sql/create_iot_access.sql` | Реестр IoT-устройств и политики доступа (§4.3) |
| `sql/add_esia_fields.sql` | Поля ЕСИА-верификации в таблице User (§4.1) |
| `sql/create_messages_notifications.sql` | Сообщения и уведомления (§3.2) |

Подробнее о схеме Supabase — в [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Скрипты

```bash
npm run dev        # dev-сервер с hot reload
npm run build      # production сборка
npm run start      # запуск production сборки
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # тесты
```

## Аутентификация

- `next-auth` — единый источник истины для состояния сессии
- Конфигурация: [`src/shared/lib/auth.ts`](src/shared/lib/auth.ts)
- Credentials-аутентификация читает пользователей из Supabase (`User` таблица, bcrypt)
- OAuth-провайдеры активируются при наличии полной пары env-переменных
- ЕСИА-провайдер: [`src/shared/lib/esiaProvider.ts`](src/shared/lib/esiaProvider.ts) — мок OIDC на базе `/api/mock-esia/*`
- После входа через ЕСИА публикуется событие `user.esia_verified` в аудит-журнал

## Мок ЕСИА

Платформа включает мок-провайдер идентификации (Госуслуги / ЕСИА):

1. Установите `ESIA_MOCK_ENABLED=true` в `.env.local`
2. Нажмите «Войти через ЕСИА» на странице входа
3. Выберите тестовую личность на `/esia/login`
4. После успешного входа в аудит-журнал записывается событие `user.esia_verified`

## Database

Основные хелперы:

- [`src/shared/utils/supabase/client.ts`](src/shared/utils/supabase/client.ts) — браузерный клиент
- [`src/shared/utils/supabase/server.ts`](src/shared/utils/supabase/server.ts) — серверный клиент (cookies)
- [`src/shared/utils/supabase/service.ts`](src/shared/utils/supabase/service.ts) — сервисный клиент (service role key)

`getServiceClient()` использует `SUPABASE_SERVICE_ROLE_KEY` для серверных операций (API routes, admin).
