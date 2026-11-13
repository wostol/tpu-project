import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import type { AuthUser, UserRole } from '../interfaces/auth-user.interface'

/**
 * OptionalJwtAuthGuard — мягкая версия JwtAuthGuard.
 *
 * Используется на публичных эндпоинтах, которые должны работать без авторизации,
 * НО хотят знать текущего пользователя, если он залогинен
 * (например, GET /api/events — чтобы вычислить isRegistered).
 *
 * Поведение:
 *   - Нет cookie access_token → пропускаем, request.user = undefined
 *   - Cookie есть, токен валидный → заполняем request.user
 *   - Cookie есть, токен невалидный → пропускаем, request.user = undefined
 *
 * В отличие от JwtAuthGuard, НИКОГДА не бросает 401.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = request.cookies?.access_token

    if (!token) {
      return true
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      })

      // Заполняем request.user — дальше @CurrentUser() достанет
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as UserRole,
      } as AuthUser
    } catch {
      // Невалидный токен — игнорируем, пользователь останется анонимом
    }

    return true
  }
}
