import { Injectable, NotFoundException } from '@nestjs/common'
import { EventsRepository } from './events.repository'
import { EventResponseDto } from './dto/event-response.dto'
import type { Event } from '@prisma/client'
import type { EventEntity } from './types/event.interface'

/**
 * EventsService — бизнес-логика мероприятий.
 *
 * Ответственность:
 *   - Получить список всех мероприятий (с пометкой isRegistered)
 *   - Получить одно мероприятие по id
 *   - Получить мероприятия, на которые пользователь зарегистрирован
 *   - Вычислить isRegistered для каждого мероприятия
 *
 * Не отвечает за:
 *   - HTTP (это EventsController)
 *   - Прямой доступ к БД (это EventsRepository)
 *
 * Workflow:
 *   Controller → Service → Repository → Prisma
 *   Каждый слой делегирует вниз и не знает деталей выше.
 */
@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  /**
   * Все мероприятия. Если userId есть — для каждого вычисляется isRegistered.
   * Чтобы избежать N+1 запросов, одним вызовом получаем множество registered ids.
   */
  async getAllEvents(userId: number | null): Promise<EventResponseDto[]> {
  const events = await this.eventsRepository.findAll()
  // Для списка — includeCounts: false (currentParticipants/Fans не считаем, дорого по N+1)
  return Promise.all(events.map((e) => this.toResponse(e, userId, false)))
}

async getEventById(id: number, userId: number | null): Promise<EventResponseDto> {
  const event = await this.eventsRepository.findById(id)
  if (!event) {
    throw new NotFoundException(`Мероприятие #${id} не найдено`)
  }
  // Для детали — includeCounts: true (показываем currentParticipants, currentFans)
  return this.toResponse(event, userId, true)
}

async getMyEvents(userId: number): Promise<EventResponseDto[]> {
  const events = await this.eventsRepository.findRegisteredByUserId(userId)
  return Promise.all(events.map((e) => this.toResponse(e, userId, false)))
}
  async registerUser(userId: number, eventId: number, registrationType: 'participant' | 'fan') {
  const event = await this.eventsRepository.findById(eventId)
  if (!event) throw new NotFoundException(`Мероприятие #${eventId} не найдено`)
  
  const existing = await this.eventsRepository.findRegistration(userId, eventId)
  if (existing) {
    throw new Error('Уже зарегистрированы')
  }
  
  await this.eventsRepository.registerUser(userId, eventId, registrationType)
  return { success: true, message: 'Регистрация прошла успешно' }
}

async unregisterUser(userId: number, eventId: number) {
  await this.eventsRepository.unregisterUser(userId, eventId)
  return { success: true, message: 'Отписка выполнена' }
}

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Маппинг доменного EventEntity → EventResponseDto.
   * Date → ISO string, чтобы фронт получал строку, а не сериализованный Date.
   */
private async toResponse(
  event: EventEntity,
  userId: number | null,
  includeCounts: boolean,
): Promise<EventResponseDto> {
  let isRegistered = false
  let registrationType: string | null = null
  let userRegistration: { id: number; role: string; status: string; registeredAt: string } | null = null

  if (userId) {
    const reg = await this.eventsRepository.findRegistration(userId, event.id)
    if (reg) {
      isRegistered = true
      registrationType = reg.registrationType
      userRegistration = {
        id: reg.id,
        role: reg.registrationType,
        status: reg.status,
        registeredAt: reg.registeredAt.toISOString(),
      }
    }
  }

  let currentParticipants = 0
  let currentFans = 0
  if (includeCounts) {
    currentParticipants = await this.eventsRepository.countParticipants(event.id)
    currentFans = await this.eventsRepository.countFans(event.id)
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    fullDescription: event.fullDescription ?? null,
    eventType: event.eventType,
    category: event.category ?? null,
    status: event.status,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    registrationDeadline: event.registrationDeadline.toISOString(),
    participantPoints: event.participantPoints,
    fanPoints: event.fanPoints,
    maxParticipants: event.maxParticipants ?? null,
    price: event.price,
    duration: event.duration ?? null,
    level: event.level ?? null,
    rules: event.rules ?? null,
    equipment: event.equipment ?? null,
    address: event.address ?? null,
    location: event.location,
    format: event.format ?? null,
    requirements: event.requirements ?? null,
    contactEmail: event.contactEmail ?? null,
    contactPhone: event.contactPhone ?? null,
    teamName: event.teamName ?? null,
    currentParticipants,
    currentFans,
    isRegistered,
    registrationType,
    userRegistration,
  }
}
}
