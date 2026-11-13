import { IsEmail, IsString, MinLength } from 'class-validator'

/**
 * DTO для тестового входа (без TPU OAuth).
 * Endpoint: POST /api/auth/test-login
 *
 * Тело: { email, password }
 * Возвращает: { user } + ставит cookies access_token, refresh_token
 */
export class TestLoginDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email!: string

  @IsString()
  @MinLength(6, { message: 'Пароль минимум 6 символов' })
  password!: string
}
