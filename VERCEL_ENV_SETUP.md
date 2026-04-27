# Настройка переменных окружения в Vercel

## Обязательные переменные окружения

Для работы приложения на Vercel необходимо добавить следующие переменные окружения в настройках проекта:

### 1. Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon (публичный) ключ Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role ключ Supabase (для обхода RLS)

### 2. NextAuth.js (КРИТИЧНО!)
- `NEXTAUTH_URL` - URL вашего приложения на Vercel
  - Для production: `https://home-share.vercel.app`
  - Для preview deployments: автоматически определяется Vercel
- `NEXTAUTH_SECRET` - Секретный ключ для подписи JWT токенов
  - Можно сгенерировать: `openssl rand -base64 32`

### 3. OAuth провайдеры (опционально)
- `GITHUB_ID` - Client ID для GitHub OAuth
- `GITHUB_SECRET` - Client Secret для GitHub OAuth
- `GOOGLE_CLIENT_ID` - Client ID для Google OAuth
- `GOOGLE_CLIENT_SECRET` - Client Secret для Google OAuth

## Как добавить переменные в Vercel

1. Перейдите в настройки проекта: **Project Settings → Environment Variables**
2. Добавьте каждую переменную:
   - **Name**: имя переменной (например, `NEXTAUTH_URL`)
   - **Value**: значение переменной
   - **Environment**: выберите окружения (Production, Preview, Development)
3. **ВАЖНО**: После добавления переменных необходимо:
   - Пересобрать деплоймент (Redeploy) или
   - Создать новый деплоймент через push в репозиторий

## Проверка переменных

После добавления переменных проверьте:
1. Все переменные добавлены для нужных окружений (Production, Preview)
2. Значения переменных корректны (без лишних пробелов, кавычек)
3. Деплоймент пересобран после добавления переменных

## Частые проблемы

### Ошибка 500 на `/api/auth/session`
- **Причина**: Отсутствует `NEXTAUTH_URL` или `NEXTAUTH_SECRET`
- **Решение**: Добавьте обе переменные и пересоберите деплоймент

### Ошибка "Invalid credentials"
- **Причина**: Неправильные значения Supabase переменных
- **Решение**: Проверьте правильность `NEXT_PUBLIC_SUPABASE_URL` и ключей

### Переменные не применяются
- **Причина**: Деплоймент не был пересобран после добавления переменных
- **Решение**: Выполните Redeploy в Vercel Dashboard
