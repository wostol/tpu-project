import { SetMetadata } from '@nestjs/common'
import type { UserRole } from '../interfaces/auth-user.interface'

export const ROLES_KEY = 'roles'

/**
 * @Roles(...) — указывает, какие роли нужны для доступа к эндпоинту.
 * Используется вместе с RolesGuard.
 *
 * @example
 *   @Get('admin-only')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('ADMIN')
 *   getAdminData() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
