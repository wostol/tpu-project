import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * @Public() — помечает эндпоинт как публичный.
 * JwtAuthGuard (если он глобальный) пропустит такие запросы без проверки токена.
 *
 * @example
 *   @Get('public-endpoint')
 *   @Public()
 *   getPublicData() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
