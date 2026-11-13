import { UserRole } from '../../common/interfaces/auth-user.interface'

/**
 * UserResponseDto — то, что отдаётся наружу как профиль пользователя.
 * Никакого passwordHash! Только безопасные поля.
 *
 * registeredEvents — массив ID мероприятий, на которые пользователь
 * зарегистрирован. Включается только когда это нужно (например,
 * для GET /api/user/me).
 */
export class UserResponseDto {
  id!: number
  email!: string
  firstName!: string
  lastName!: string
  middleName!: string | null
  name!: string  // полное имя: "Иванов Иван Иванович"
  username!: string | null
  role!: UserRole
  group!: string | null
  faculty!: string | null
  totalPoints!: number
  registeredEvents?: number[]
}
