import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthUser } from '../interfaces/auth-user.interface'

/**
 * @CurrentUser() — достаёт пользователя из request.user.
 * Ставится на параметр контроллера, чтобы получить текущего авторизованного пользователя.
 *
 * @example
 *   @Get('me')
 *   @UseGuards(JwtAuthGuard)
 *   getMe(@CurrentUser() user: AuthUser) { return user }
 *
 * Если user опционален (эндпоинт публичный, но юзер может быть):
 *   @CurrentUser() user?: AuthUser  ← будет undefined, если не авторизован
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | AuthUser[keyof AuthUser] | undefined => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as AuthUser | undefined
    return data ? user?.[data] : user
  },
)
