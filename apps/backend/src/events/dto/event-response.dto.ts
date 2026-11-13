/**
 * EventResponseDto — то, что отдаётся наружу как мероприятие.
 *
 * ВАЖНО: формат СТРОГО совпадает с apps/user-site/src/mocks/events.json,
 * чтобы переключение мок→бэкенд прошло незаметно для фронта.
 *
 * isRegistered — вычисляется в сервисе на основе текущего пользователя:
 *   - если запрос анонимный → false
 *   - если авторизован → true если есть EventRegistration
 */
export class EventResponseDto {
  id!: number
  title!: string
  description!: string
  fullDescription!: string | null
  eventType!: string
  category!: string | null
  status!: string
  startDate!: string
  endDate!: string | null
  registrationDeadline!: string
  participantPoints!: number
  fanPoints!: number
  maxParticipants!: number | null
  price!: number
  duration!: string | null
  level!: string | null
  rules!: string | null
  equipment!: string | null
  address!: string | null
  location!: string
  format!: string | null
  requirements!: string | null
  contactEmail!: string | null
  contactPhone!: string | null
  teamName!: string | null
  currentParticipants!: number
  currentFans!: number
  isRegistered!: boolean
  registrationType!: string | null
  userRegistration!: { id: number; role: string; status: string; registeredAt: string } | null
}
