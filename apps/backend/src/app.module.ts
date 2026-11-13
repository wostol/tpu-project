import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ConfigModule } from './config/config.module'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { EventsModule } from './events/events.module'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ShopModule } from './shop/shop.module'
import { ProfileModule } from './profile/profile.module'
import { LevelsModule } from './levels/levels.module'
import { NotificationsModule } from './notifications/notifications.module'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
/**
 * AppModule — корневой модуль приложения.
 *
 * Импортирует:
 *   - ConfigModule   — загрузка и валидация .env
 *   - PrismaModule   — @Global, доступен всем
 *   - AuthModule     — JWT, guards, /api/auth/*
 *   - UsersModule    — /api/users, /api/user/me
 *   - EventsModule   — /api/events/*
 *
 * Глобально регистрирует:
 *   - JwtAuthGuard — все эндпоинты требуют JWT по умолчанию
 *     (чтобы сделать публичный — помечаем @Public())
 *   - HttpExceptionFilter — единый формат ошибок
 */

@Module({
    imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false, maxAge: '7d' },
    }),
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    ShopModule,
    ProfileModule,
    LevelsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
