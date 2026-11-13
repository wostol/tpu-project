/**
 * EventEntity — доменная модель мероприятия.
 * Совпадает с Prisma-схемой Event, но описана как интерфейс —
 * чтобы бизнес-логика не зависела от Prisma напрямую (Dependency Inversion).
 *
 * isRegistered — вычисляется в сервисе, не хранится в БД.
 */
export interface EventEntity {
  id: number
  title: string
  description: string
  fullDescription: string | null
  eventType: string
  category: string | null
  status: string
  startDate: Date
  endDate: Date | null
  registrationDeadline: Date
  participantPoints: number
  fanPoints: number
  maxParticipants: number | null
  price: number
  duration: string | null
  level: string | null
  rules: string | null
  equipment: string | null
  address: string | null
  location: string
  format: string | null
  requirements: string | null
  contactEmail: string | null
  contactPhone: string | null
  teamName: string | null
  organizerId: number | null
}
