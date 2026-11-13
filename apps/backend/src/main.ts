import { NestFactory, Reflector } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'

/**
 * Точка входа приложения.
 *
 * Конфигурирует:
 *   - Глобальный prefix /api — все роуты под /api/*
 *   - ValidationPipe — DTO-валидация (class-validator)
 *   - CORS — allowlist origins из .env
 *   - cookie-parser — чтение cookies (нужно для JWT в httpOnly cookies)
 *   - Swagger UI — /api/docs
 *   - Глобальный JwtAuthGuard — через APP_GUARD, см. app.module.ts
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const configService = app.get(ConfigService)
  const port = configService.get<number>('app.port') ?? 3000
  const corsOrigins = configService.get<string[]>('cors.origins') ?? ['http://localhost:5173']

  // Глобальный prefix — все endpoint'ы начинаются с /api
  app.setGlobalPrefix('api', {
    exclude: [], // /api/docs тоже будет под /api, но Swagger сам добавит
  })

  // DTO-валидация: whitelist убирает поля не из DTO, transform приводит типы
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // CORS — allowlist
  app.enableCors({
    origin: corsOrigins,
    credentials: true, // важно для cookies при cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // cookie-parser — обязательный, потому что JWT в httpOnly cookies
  app.use(cookieParser())

  // JwtAuthGuard регистрируется глобально через APP_GUARD в AppModule,
  // но ему нужен Reflector (внедряется автоматически через DI).
  // Дополнительно регистрировать здесь не нужно.

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TPU Project API')
    .setDescription('Бэкенд ВКР — спортивные мероприятия университета')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  // Swagger UI доступен на /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  })

  await app.listen(port, '0.0.0.0')
  logger.log(`🚀 Backend running on http://localhost:${port}`)
  logger.log(`📖 Swagger UI:        http://localhost:${port}/api/docs`)
}

bootstrap().catch((err) => {
  console.error('❌ Failed to bootstrap', err)
  process.exit(1)
})
