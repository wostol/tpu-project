import { Module, Global } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { configuration } from './configuration'
import { envValidationSchema } from './env.validation'

/**
 * Глобальный конфиг-модуль.
 * Загружает .env, валидирует схему, экспортирует ConfigService во всё приложение.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // показать все ошибки сразу, а не первую
      },
    }),
  ],
})
export class ConfigModule {}
