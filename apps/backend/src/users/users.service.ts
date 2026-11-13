import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { User, EventRegistration } from '@prisma/client'
import type { UserRole } from '../common/interfaces/auth-user.interface'
import { UserResponseDto } from './dto/user-response.dto'

/**
 * UsersService — бизнес-логика работы с пользователями.
 *
 * Ответственность:
 *   - Получить текущего пользователя (по JWT)
 *   - Маппить Prisma User → UserResponseDto (безопасный)
 *
 * Не отвечает за:
 *   - Проверку пароля (это AuthService)
 *   - HTTP-слой (это UsersController)
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Возвращает профиль пользователя с registeredEvents.
   * Используется в GET /api/user/me.
   */
  async getCurrentUser(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { registrations: { select: { eventId: true } } },
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден')
    }

    return this.toResponse(user, true)
  }

  /**
   * Проверяет существование пользователя по id (для guards/interceptors).
   */
  async findById(id: number): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    return user ? this.toResponse(user, false) : null
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Маппинг Prisma-модели в UserResponseDto.
   * @param user — Prisma-объект пользователя
   * @param includeRegistrations — включить ли registeredEvents в ответ
   */
private toResponse(
  user: User & { registrations?: Pick<EventRegistration, 'eventId'>[] },
  includeRegistrations: boolean,
): UserResponseDto {
  const middleName = user.middleName ?? ''
  const name = [user.lastName, user.firstName, middleName].filter(Boolean).join(' ')
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    name,
    username: user.username,
    role: user.role as UserRole,
    group: user.group,
    faculty: user.faculty,
    totalPoints: user.totalPoints,
    ...(includeRegistrations && user.registrations
      ? { registeredEvents: user.registrations.map((r) => r.eventId) }
      : {}),
  }
}
}
