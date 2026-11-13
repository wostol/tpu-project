import { Body, Controller, Post, Res, HttpCode, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { TestLoginDto } from './dto/test-login.dto'
import { TpuLoginDto } from './dto/tpu-login.dto'
import { Public } from '../common/decorators/public.decorator'

/**
 * AuthController — HTTP-слой аутентификации.
 *
 * Endpoint'ы (все под /api/auth/*):
 *   POST /test-login  — тестовый вход (email + password)
 *   POST /login       — TPU OAuth flow (заглушка, 501)
 *   POST /logout      — очистка cookies
 *   POST /refresh     — обновление access-токена
 *
 * Контроллер НЕ содержит бизнес-логики — только:
 *   - парсинг тела запроса
 *   - вызов сервиса
 *   - установку cookies на response
 *   - форматирование ответа
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Тестовый вход. Возвращает { user } и ставит httpOnly cookies.
   * Используется, пока TPU OAuth недоступен.
   */
  @Post('test-login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Тестовый вход (без TPU OAuth)' })
  @ApiResponse({ status: 200, description: 'Успешный вход, cookies установлены' })
  @ApiResponse({ status: 401, description: 'Неверный пароль' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async testLogin(
    @Body() dto: TestLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: unknown }> {
    const result = await this.authService.testLogin(dto.email, dto.password)

    this.setAuthCookies(res, result.accessToken, result.refreshToken)

    return { user: result.user }
  }

  /**
   * Заглушка TPU OAuth login. Фронтенд вызывает этот эндпоинт
   * в authService.exchangeCodeForToken() — но пока TPU бэкенд мёртв,
   * возвращаем 501. Когда оживёте — тут будет настоящий обмен.
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход через TPU OAuth (заглушка)' })
  @ApiResponse({ status: 501, description: 'Не реализовано, используйте /test-login' })
  async tpuLogin(@Body() dto: TpuLoginDto): Promise<never> {
    return this.authService.tpuLogin(dto.code, dto.codeVerifier)
  }

  /**
   * Выход — просто очищаем cookies. Серверный blacklist токенов
   * для VKR избыточен (JWT stateless).
   */
  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Выход — очистка cookies' })
  async logout(@Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    this.clearAuthCookies(res)
    return { ok: true }
  }

  /**
   * Обновление access-токена по refresh-токену из cookie.
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить access-токен' })
  @ApiResponse({ status: 200, description: 'Новые cookies установлены' })
  @ApiResponse({ status: 401, description: 'Невалидный refresh-токен' })
  async refresh(@Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    // RefreshGuard должен был проверить токен и положить его в res.locals
    // Но для простоты — читаем cookie напрямую
    const refreshToken = res.req.cookies?.refresh_token
    if (!refreshToken) {
      return { ok: true } // без refresh-токена — ничего не делаем
    }

    try {
      const result = await this.authService.refresh(refreshToken)
      this.setAuthCookies(res, result.accessToken, result.refreshToken)
      return { ok: true }
    } catch {
      this.clearAuthCookies(res)
      return { ok: true }
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const accessTtl = this.parseTtlToMs(this.configService.get<string>('jwt.accessTtl') ?? '15m')
    const refreshTtl = this.parseTtlToMs(this.configService.get<string>('jwt.refreshTtl') ?? '7d')

    const baseOptions = {
      httpOnly: true,
      secure: this.configService.get<boolean>('cookie.secure') ?? false,
      sameSite: this.configService.get<'lax' | 'strict' | 'none'>('cookie.sameSite') ?? 'lax',
      domain: this.configService.get<string>('cookie.domain') || undefined,
      path: '/',
    }

    res.cookie('access_token', accessToken, { ...baseOptions, maxAge: accessTtl })
    res.cookie('refresh_token', refreshToken, { ...baseOptions, maxAge: refreshTtl })
  }

  private clearAuthCookies(res: Response): void {
    const baseOptions = {
      httpOnly: true,
      secure: this.configService.get<boolean>('cookie.secure') ?? false,
      sameSite: this.configService.get<'lax' | 'strict' | 'none'>('cookie.sameSite') ?? 'lax',
      domain: this.configService.get<string>('cookie.domain') || undefined,
      path: '/',
    }

    res.clearCookie('access_token', baseOptions)
    res.clearCookie('refresh_token', baseOptions)
  }

  /**
   * Парсит TTL формата '15m', '7d', '1h' в миллисекунды.
   */
  private parseTtlToMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl)
    if (!match) return 15 * 60 * 1000 // fallback 15 минут
    const value = parseInt(match[1], 10)
    const unit = match[2]
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
    return value * (multipliers[unit] ?? 60_000)
  }
}
