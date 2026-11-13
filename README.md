# TPU Project

ВКР: веб-сайт спортивных мероприятий университета.

## Структура монорепозитория

```
tpu-project/
├── apps/
│   ├── user-site/        # Пользовательский сайт (React + Vite)
│   └── backend/          # NestJS API (TypeScript, Prisma, JWT auth)
├── Kontora/              # Исходные шрифты (OTF/WOFF) — дизайн-артефакты
├── docker/
│   └── docker-compose.dev.yml   # PostgreSQL + Redis (для прод-режима БД)
├── .vscode/settings.json
├── .gitignore
├── README.md
└── package.json          # Workspaces root
```

Позже добавятся:
- `apps/admin-site/` — админ-панель

## Быстрый старт

### Установка

```bash
npm install
```

### Запуск пользовательского сайта (с моками)

```bash
npm run dev:user
```

Откройте http://localhost:5173 — мероприятия загружаются из моков (`apps/user-site/src/mocks/`).

### Запуск бэкенда

```bash
# 1. Накатить миграции и засеять БД (первый раз)
npm --workspace apps/backend run prisma:migrate
# это автоматически запустит seed

# 2. Запустить бэкенд
npm run dev:backend
```

Откройте http://localhost:3000/api/docs — Swagger UI с описанием всех endpoint'ов.

### Подключить фронт к реальному бэкенду

В `apps/user-site/.env.local` поменяйте:
```bash
VITE_USE_MOCKS=false
VITE_API_URL=http://localhost:3000
```

Перезапустите `npm run dev:user`. Фронт обращается к тем же endpoint'ам,
но теперь через Vite proxy попадает на реальный NestJS-бэкенд.

## Тестовые пользователи

После `prisma:seed` в БД создаются:

| Email | Пароль | Роль | Описание |
|---|---|---|---|
| `user@tpu.ru` | `password123` | USER | Иван Петров, студент ИНК, 280 баллов, зарегистрирован на event #3 |
| `admin@tpu.ru` | `admin123` | ADMIN | Администратор системы |

### Тестовый вход

Пока TPU OAuth недоступен — используйте страницу тестового входа:

1. Откройте http://localhost:5173/dev-login
2. Нажмите «Войти как ПОЛЬЗОВАТЕЛЬ» или «Войти как АДМИНИСТРАТОР»
3. Вы будете перенаправлены на главную страницу как авторизованный пользователь

Эта страница не трогает код TPU OAuth — отдельная, для разработки.
Когда TPU бэкенд оживёт, основная авторизация заработает автоматически.

## Архитектура бэкенда

NestJS с строгой OOP-архитектурой, слой за слоем:

```
HTTP request
    ↓
Controller (HTTP layer)    — парсинг тела, маршрутизация, установка cookies
    ↓
Service (business logic)   — правила предметной области
    ↓
Repository (data access)   — запросы к Prisma
    ↓
PrismaService              — singleton-обёртка над PrismaClient
    ↓
Database (SQLite/PostgreSQL)
```

### Модули

- **ConfigModule** (@Global) — валидация .env через Joi, типизированный ConfigService
- **PrismaModule** (@Global) — PrismaService с lifecycle-хуками
- **AuthModule** (@Global) — JwtModule, JwtStrategy, AuthService, OptionalJwtAuthGuard
- **UsersModule** — UsersController (/api/users, /api/user/me)
- **EventsModule** — EventsController (/api/events, /api/events/:id, /api/events/my)

### OOP-принципы

- **Single Responsibility**: каждый класс — одна ответственность (controller → service → repository)
- **Dependency Inversion**: бизнес-логика зависит от интерфейсов (EventEntity), не от Prisma
- **Open/Closed**: новые endpoint'ы добавляются декораторами, без изменения существующих
- **DRY**: конфигурация cookies, JWT — в одном месте

### Авторизация

- JWT access token (15 мин) + refresh token (7 дней) в httpOnly cookies
- Глобальный `JwtAuthGuard` — все эндпоинты требуют auth по умолчанию
- `@Public()` — помечает публичные эндпоинты (auth/login, auth/test-login, events)
- `OptionalJwtAuthGuard` — для публичных эндпоинтов с опциональным user (events/:id вычисляет isRegistered)
- `@Roles('ADMIN')` + `RolesGuard` — для admin-only эндпоинтов
- bcrypt для хэширования паролей

## Endpoint'ы

Все под префиксом `/api/`:

| Method | Path | Auth | Описание |
|---|---|---|---|
| POST | /api/auth/test-login | @Public | Тестовый вход (email + password) |
| POST | /api/auth/login | @Public | TPU OAuth flow (заглушка, 501) |
| POST | /api/auth/logout | @Public | Очистка cookies |
| POST | /api/auth/refresh | @Public | Обновление access-токена |
| GET | /api/users | JWT | Auth-чек (200 если авторизован) |
| GET | /api/user/me | JWT | Профиль с registeredEvents |
| GET | /api/events | Optional | Все мероприятия (с isRegistered если залогинен) |
| GET | /api/events/my | JWT | Мероприятия пользователя |
| GET | /api/events/:id | Optional | Одно мероприятие |

Swagger UI: http://localhost:3000/api/docs

## Переменные окружения

### Frontend (`apps/user-site/.env.local`)

| Переменная | По умолчанию | Описание |
|---|---|---|
| `VITE_API_URL` | `/api` | Базовый URL API |
| `VITE_USE_MOCKS` | `true` | Включить mock-API (Vite middleware) |
| `VITE_TPU_OAUTH_CLIENT_ID` | — | Client ID из https://api.tpu.ru/dashboard |

### Backend (`apps/backend/.env`)

| Переменная | По умолчанию | Описание |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite для dev. Для PostgreSQL: `postgresql://dev:dev@localhost:5432/tpu_dev` |
| `JWT_ACCESS_SECRET` | — | Минимум 32 символа |
| `JWT_REFRESH_SECRET` | — | Минимум 32 символа |
| `JWT_ACCESS_TTL` | `15m` | TTL access-токена |
| `JWT_REFRESH_TTL` | `7d` | TTL refresh-токена |
| `CORS_ORIGIN` | `http://localhost:5173` | Список через запятую |
| `PORT` | `3000` | Порт бэкенда |
| `ADMIN_EMAILS` | `admin@tpu.ru` | Кому выдавать роль ADMIN при TPU-входе |

## Переключение с SQLite на PostgreSQL

1. Поднять Postgres через Docker:
   ```bash
   npm run db:up
   ```
2. В `apps/backend/.env`:
   ```
   DATABASE_URL="postgresql://dev:dev@localhost:5432/tpu_dev"
   ```
3. В `apps/backend/prisma/schema.prisma`:
   ```
   datasource db {
     provider = "postgresql"  # было "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
4. Накатить миграции заново:
   ```bash
   npm --workspace apps/backend run prisma:migrate
   ```

## TPU OAuth (когда бэкенд TPU оживёт)

Код TPU OAuth в `apps/user-site/src/AuthHandler.js` сохранён без изменений.
Изменены только обращения к `process.env`:
- `process.env.PUBLIC_URL` → `BASE_URL` из `src/config.js`
- `process.env.REACT_APP_TPU_OAUTH_CLIENT_ID` → `import.meta.env.VITE_TPU_OAUTH_CLIENT_ID`

Когда бэкенд TPU снова станет доступным — авторизация заработает без правок кода:
1. Укажите `VITE_TPU_OAUTH_CLIENT_ID` в `.env.local`
2. Поставьте `VITE_USE_MOCKS=false`
3. На бэкенде реализуйте `authService.tpuLogin()` (заглушка возвращает 501)

## Migration notes (CRA → Vite)

- 19 `.js` файлов с JSX переименованы в `.jsx`
- Чистая логика осталась в `.js` (authService, apiClient, stores, hooks)
- Все `process.env.REACT_APP_*` → `import.meta.env.VITE_*`
- `process.env.PUBLIC_URL` → `import.meta.env.BASE_URL`
- Хардкод `https://songeng.voold.online/api` убран — вынесен в `src/config.js`
- Шрифты: `format('woff2')` для `.woff` файлов исправлен на `format('woff')`
- CRA-специфика удалена: `react-scripts`, `setupTests.js`, `reportWebVitals.js`, `App.test.js`

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev:user` | Запустить фронтенд (Vite dev server) |
| `npm run dev:backend` | Запустить бэкенд (NestJS watch mode) |
| `npm run build:user` | Собрать фронтенд для прода |
| `npm run build:backend` | Собрать бэкенд (nest build) |
| `npm run db:up` | Поднять Postgres + Redis через Docker |
| `npm run db:down` | Остановить Docker-контейнеры |
| `npm run prisma:migrate` | Накатить миграции БД |
| `npm run prisma:seed` | Засеять БД тестовыми данными |
| `npm run prisma:studio` | Открыть Prisma Studio (GUI для БД) |
