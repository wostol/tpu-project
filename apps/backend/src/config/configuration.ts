/**
 * Типизированный доступ к переменным окружения.
 * ConfigService из @nestjs/config возвращает unknown — здесь обёртка с типами,
 * чтобы во всём коде был автокомплит и проверка типов.
 */
export interface IAppConfig {
  database: {
    url: string
  }
  jwt: {
    accessSecret: string
    refreshSecret: string
    accessTtl: string
    refreshTtl: string
  }
  cookie: {
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    domain: string
  }
  cors: {
    origins: string[]
  }
  app: {
    port: number
    nodeEnv: 'development' | 'production' | 'test'
  }
  tpu: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
  adminEmails: string[]
}

export const configuration = (): IAppConfig => ({
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAMESITE as 'strict' | 'lax' | 'none') ?? 'lax',
    domain: process.env.COOKIE_DOMAIN ?? '',
  },
  cors: {
    origins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') ?? 'development',
  },
  tpu: {
    clientId: process.env.TPU_OAUTH_CLIENT_ID ?? '',
    clientSecret: process.env.TPU_OAUTH_CLIENT_SECRET ?? '',
    redirectUri: process.env.TPU_OAUTH_REDIRECT_URI ?? '',
  },
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
})
