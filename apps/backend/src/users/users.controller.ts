import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthUser } from '../common/interfaces/auth-user.interface'
import { UsersService } from './users.service'
import { UserResponseDto } from './dto/user-response.dto'

/**
 * UsersController — HTTP-слой пользователей.
 *
 * Endpoint'ы (под /api/*):
 *   GET /users     — проверка аутентификации (используется apiClient.checkAuthAndRefresh)
 *                    возвращает 200 + профиль если авторизован, иначе 401
 *   GET /user/me   — профиль текущего пользователя с registeredEvents
 *
 * ВАЖНО: /users — это для auth-чека, /user/me — для профиля.
 * Так сложилось исторически из фронтового apiClient — сохраняем совместимость.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Auth-чек: фронтовый apiClient.checkAuthAndRefresh() вызывает этот эндпоинт,
   * чтобы понять, валидна ли сессия. Возвращает профиль пользователя.
   */
  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Проверка аутентификации' })
  @ApiResponse({ status: 200, description: 'Авторизован', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async checkAuth(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    return this.usersService.findById(user.id) as Promise<UserResponseDto>
  }

  /**
   * Полный профиль с registeredEvents — для личного кабинета.
   */
  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль с registeredEvents', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getMe(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    return this.usersService.getCurrentUser(user.id)
  }
}
