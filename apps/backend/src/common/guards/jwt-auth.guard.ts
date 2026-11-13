import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

/**
 * JwtAuthGuard — проверяет JWT в cookie или Authorization header.
 *
 * Если эндпоинт помечен @Public() — пропускает без проверки.
 * Иначе требует валидный access_token и кладёт пользователя в request.user.
 *
 * Используется как guard на отдельных контроллерах/эндпоинтах
 * или как глобальный guard (тогда @Public() для исключений).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    return super.canActivate(context)
  }

  handleRequest<TUser = any>(err: unknown, user: TUser, _info?: unknown, _context?: ExecutionContext, _status?: unknown): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Не авторизован')
    }
    return user
  }
}
