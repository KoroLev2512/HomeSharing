# LockBox CRM

Система управления объектами недвижимости с полноценной авторизацией и OAuth провайдерами.

## 🚀 Возможности

### 🔐 Авторизация
- **Регистрация и вход** по email/паролю
- **OAuth провайдеры**: Google, VK
- **Роли пользователей**: Пользователь, Администратор, Сервис
- **Защищенные маршруты** с проверкой ролей
- **Автоматический редирект** неавторизованных пользователей

### 🏠 Управление объектами
- Просмотр списка объектов недвижимости
- Детальная информация об объектах
- Поиск и фильтрация

### 👤 Профиль пользователя
- Отображение информации о пользователе
- Управление ролями
- Безопасный выход из системы

## 🛠 Технологии

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes
- **База данных**: Supabase (PostgreSQL)
- **Авторизация**: NextAuth.js 4
- **Стили**: SCSS Modules
- **Состояние**: Zustand

## 📦 Установка и запуск

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd homesharing
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка базы данных
Проект использует Supabase в качестве базы данных. Убедитесь, что у вас есть:
- Аккаунт Supabase
- Созданный проект в Supabase
- Таблицы созданы в базе данных (User, Account, Session, VerificationToken)

### 4. Настройка переменных окружения
Создайте файл `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (опционально)
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 5. Запуск проекта
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 🔧 Настройка OAuth провайдеров

### Google OAuth
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Добавьте разрешенные URI перенаправления:
   - `http://localhost:3000/api/auth/callback/google` (разработка)
   - `https://yourdomain.com/api/auth/callback/google` (продакшен)

### VK OAuth
1. Перейдите в [VK Developers](https://vk.com/dev)
2. Создайте новое приложение
3. Получите Client ID и Client Secret
4. Добавьте разрешенные URI перенаправления:
   - `http://localhost:3000/api/auth/callback/vk` (разработка)
   - `https://yourdomain.com/api/auth/callback/vk` (продакшен)

## 📁 Структура проекта

```
lockbox/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts    # NextAuth конфигурация
│   │   │   │   └── signout/route.ts          # API выхода
│   │   │   └── register/route.ts             # API регистрации
│   │   ├── login/page.tsx                    # Страница входа
│   │   ├── register/page.tsx                 # Страница регистрации
│   │   └── page.tsx                          # Главная страница
│   ├── components/
│   │   ├── AuthGuard.tsx                     # Защита маршрутов
│   │   └── UserProfile.tsx                   # Профиль пользователя
│   ├── hooks/
│   │   └── useUserRole.ts                    # Хук для ролей
│   ├── lib/
│   │   └── auth.ts                           # Конфигурация NextAuth
│   ├── utils/
│   │   └── supabase/                         # Supabase клиенты
│   │       ├── server.ts                     # Серверный клиент
│   │       ├── client.ts                    # Браузерный клиент
│   │       └── middleware.ts                # Middleware клиент
│   └── ui/
│       └── NavigationBar/                    # Навигационная панель
└── README.md
```

## 🔐 Безопасность

- **Хеширование паролей** с bcrypt
- **JWT токены** для сессий
- **CSRF защита** через NextAuth
- **Валидация данных** на клиенте и сервере
- **Защищенные API маршруты**

## 🎨 UI/UX

- **Адаптивный дизайн** для всех устройств
- **Современный интерфейс** с градиентами и анимациями
- **Интуитивная навигация**
- **Состояния загрузки** и обработка ошибок

## 🚀 Развертывание

### Vercel (рекомендуется)
1. Подключите репозиторий к Vercel
2. Настройте переменные окружения
3. Deploy!

### Другие платформы
- Настройте PostgreSQL базу данных
- Укажите переменные окружения
- Запустите `npm run build && npm start`

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте issue в репозитории.
