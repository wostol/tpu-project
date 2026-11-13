import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { AuthUser } from '../../common/interfaces/auth-user.interface'

/**
 * JwtStrategy — извлекает JWT из cookie `access_token` (или Authorization header),
 * проверяет подпись, и возвращает AuthUser, который попадает в request.user.
 *
 * Используется JwtAuthGuard'ом автоматически — ничего вручную вызывать не нужно.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('jwt.accessSecret')
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET не задан в .env')
    }

    super({
      // JWT ищется сначала в cookie, потом в Authorization: Bearer ...
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => request?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  /**
   * validate() вызывается после того, как подпись JWT проверена.
   * Возвращает то, что попадёт в request.user.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Некорректный токен')
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as AuthUser['role'],
    }
  }
}

interface JwtPayload {
  sub: number
  email: string
  role: string
  iat?: number
  exp?: number
}
