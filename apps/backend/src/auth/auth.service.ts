import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  NotImplementedException,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthUser, UserRole } from '../common/interfaces/auth-user.interface'

/**
 * AuthService — бизнес-логика аутентификации.
 *
 * Ответственность:
 *   - Проверка email/password (test-login)
 *   - Генерация JWT access и refresh токенов
 *   - Валидация refresh-токена при продлении сессии
 *
 * Не отвечает за:
 *   - HTTP-слой (это контроллер)
 *   - Доступ к БД напрямую (через PrismaService)
 *   - Установку cookies (это контроллер)
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Тестовый вход: проверяет email/password, возвращает user + токены.
   * Используется пока TPU OAuth недоступен.
   */
  async testLogin(
    email: string,
    password: string,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный пароль')
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    }

    const accessToken = await this.generateAccessToken(authUser)
    const refreshToken = await this.generateRefreshToken(authUser)

    this.logger.log(`✓ Test login: ${user.email} (${user.role})`)
    return { user: authUser, accessToken, refreshToken }
  }

  /**
   * Заглушка TPU OAuth login. Когда бэкенд TPU снова заработает,
   * здесь будет обмен code → token → profile.
   */
  async tpuLogin(code: string, codeVerifier: string): Promise<never> {
    this.logger.warn(`TPU OAuth login not implemented (code=${code.slice(0, 8)}...)`)
    throw new NotImplementedException(
      'Вход через TPU OAuth временно недоступен. Используйте /api/auth/test-login',
    )
  }

  /**
   * Обновление access-токена по refresh-токену.
   * Возвращает новые access + refresh токены.
   */
  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      })

      const authUser: AuthUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as UserRole,
      }

      return {
        accessToken: await this.generateAccessToken(authUser),
        refreshToken: await this.generateRefreshToken(authUser),
      }
    } catch {
      throw new UnauthorizedException('Невалидный refresh-токен')
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async generateAccessToken(user: AuthUser): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessTtl') as any,
      },
    )
  }

  private async generateRefreshToken(user: AuthUser): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role, type: 'refresh' },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshTtl') as any,
      },
    )
  }
}
