/**
 * Валидация переменных окружения при старте приложения.
 * Если в .env чего-то не хватает — приложение упадёт с понятной ошибкой,
 * а не поедет дальше с undefined в конфигурации.
 */
import * as Joi from 'joi'

export const envValidationSchema = Joi.object({
  // База данных
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  // Cookies
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAMESITE: Joi.string()
    .valid('strict', 'lax', 'none')
    .default('lax'),
  COOKIE_DOMAIN: Joi.string().allow('').default(''),

  // CORS
  CORS_ORIGIN: Joi.string().required(),

  // App
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // TPU OAuth
  TPU_OAUTH_CLIENT_ID: Joi.string().allow('').default(''),
  TPU_OAUTH_CLIENT_SECRET: Joi.string().allow('').default(''),
  TPU_OAUTH_REDIRECT_URI: Joi.string().allow('').default(''),

  // Admin emails
  ADMIN_EMAILS: Joi.string().allow('').default(''),
})
