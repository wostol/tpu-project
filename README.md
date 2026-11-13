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

````

### Модули

- **ConfigModule** (@Global) — валидация .env через Joi, типизированный ConfigService
- **PrismaModule** (@Global) — PrismaService с lifecycle-хуками
- **AuthModule** (@Global) — JwtModule, JwtStrategy, AuthService, OptionalJwtAuthGuard
- **UsersModule** — UsersController (/api/users, /api/user/me)
- **EventsModule** — EventsController (/api/events, /api/events/:id, /api/events/my)


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


## Переключение с SQLite на PostgreSQL

1. Поднять Postgres через Docker:
   ```bash
   npm run db:up
````

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

## Скрипты

| Команда                  | Описание                              |
| ------------------------ | ------------------------------------- |
| `npm run dev:user`       | Запустить фронтенд (Vite dev server)  |
| `npm run dev:backend`    | Запустить бэкенд (NestJS watch mode)  |
| `npm run build:user`     | Собрать фронтенд для прода            |
| `npm run build:backend`  | Собрать бэкенд (nest build)           |
| `npm run db:up`          | Поднять Postgres + Redis через Docker |
| `npm run db:down`        | Остановить Docker-контейнеры          |
| `npm run prisma:migrate` | Накатить миграции БД                  |
| `npm run prisma:seed`    | Засеять БД тестовыми данными          |
| `npm run prisma:studio`  | Открыть Prisma Studio (GUI для БД)    |
