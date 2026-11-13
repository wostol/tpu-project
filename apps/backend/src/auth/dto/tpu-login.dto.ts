import { IsString, IsNotEmpty } from 'class-validator'

/**
 * DTO для входа через TPU OAuth (code flow с PKCE).
 * Endpoint: POST /api/auth/login
 *
 * Тело: { code, codeVerifier }
 *
 * ВАЖНО: сейчас TPU бэкенд недоступен, и этот эндпоинт возвращает 501 Not Implemented.
 * Когда бэкенд TPU оживёт — здесь будет логика обмена code → token.
 * Заглушка оставлена, чтобы совпадало с тем, что фронтенд вызывает
 * в authService.exchangeCodeForToken().
 */
export class TpuLoginDto {
  @IsString()
  @IsNotEmpty()
  code!: string

  @IsString()
  @IsNotEmpty()
  codeVerifier!: string
}
