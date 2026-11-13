import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { AuthUser, UserRole } from '../interfaces/auth-user.interface'

/**
 * RolesGuard — проверяет, что у текущего пользователя есть одна из ролей,
 * указанных через @Roles(...).
 *
 * Должен идти ПОСЛЕ JwtAuthGuard в цепочке guards,
 * чтобы request.user уже был заполнен.
 *
 * @example
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('ADMIN')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // Если @Roles не указан — значит эндпоинт доступен любому авторизованному
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as AuthUser | undefined

    if (!user) {
      throw new ForbiddenException('Требуется авторизация')
    }

    const hasRole = requiredRoles.includes(user.role)
    if (!hasRole) {
      throw new ForbiddenException(
        `Требуется роль: ${requiredRoles.join(' или ')}. У вас: ${user.role}`,
      )
    }

    return true
  }
}
