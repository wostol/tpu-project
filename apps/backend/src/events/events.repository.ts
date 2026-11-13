import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { Event } from '@prisma/client'
import type { EventEntity } from './types/event.interface'

/**
 * EventsRepository — слой доступа к данным о мероприятиях.
 *
 * ОТВЕЧАЕТ ЗА:
 *   - Все запросы к Prisma, связанные с Event и EventRegistration
 *   - Маппинг Prisma-модели в доменный EventEntity (чтобы сервис
 *     не зависел от деталей Prisma)
 *
 * НЕ ОТВЕЧАЕТ ЗА:
 *   - Бизнес-логику (это EventsService)
 *   - HTTP (это EventsController)
 *
 * Так соблюдается Single Responsibility и Dependency Inversion —
 * если завтра поменяем Prisma на TypeORM, меняется только этот класс.
 */
@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<EventEntity[]> {
    const events = await this.prisma.event.findMany({
      orderBy: { startDate: 'asc' },
    })
    return events.map(this.toEntity)
  }

  async findById(id: number): Promise<EventEntity | null> {
    const event = await this.prisma.event.findUnique({ where: { id } })
    return event ? this.toEntity(event) : null
  }

  async findRegisteredByUserId(userId: number): Promise<EventEntity[]> {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { event: { startDate: 'asc' } },
    })
    return registrations.map((r) => this.toEntity(r.event))
  }
  async registerUser(userId: number, eventId: number, registrationType: 'participant' | 'fan') {
  return this.prisma.eventRegistration.create({
    data: { userId, eventId, registrationType },
  })
}

async unregisterUser(userId: number, eventId: number) {
  return this.prisma.eventRegistration.deleteMany({
    where: { userId, eventId },
  })
}

async countParticipants(eventId: number): Promise<number> {
  return this.prisma.eventRegistration.count({
    where: { eventId, registrationType: 'participant' },
  })
}

async countFans(eventId: number): Promise<number> {
  return this.prisma.eventRegistration.count({
    where: { eventId, registrationType: 'fan' },
  })
}

async findRegistration(userId: number, eventId: number) {
  return this.prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  })
}
  /**
   * Проверяет, зарегистрирован ли пользователь на мероприятие.
   * Возвращает true/false — без join, чтобы не нагружать БД.
   */
  async isUserRegistered(userId: number, eventId: number): Promise<boolean> {
    const count = await this.prisma.eventRegistration.count({
      where: { userId, eventId },
    })
    return count > 0
  }

  /**
   * Возвращает множество ID мероприятий, на которые зарегистрирован пользователь.
   * Используется в EventsService.getAllEvents(), чтобы не делать N+1 запросов.
   */
  async findRegisteredEventIds(userId: number): Promise<Set<number>> {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { userId },
      select: { eventId: true },
    })
    return new Set(registrations.map((r) => r.eventId))
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

private toEntity(event: Event): EventEntity {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    fullDescription: event.fullDescription,
    eventType: event.eventType,
    category: event.category,
    status: event.status,
    startDate: event.startDate,
    endDate: event.endDate,
    registrationDeadline: event.registrationDeadline,
    participantPoints: event.participantPoints,
    fanPoints: event.fanPoints,
    maxParticipants: event.maxParticipants,
    price: event.price,
    duration: event.duration,
    level: event.level,
    rules: event.rules,
    equipment: event.equipment,
    address: event.address,
    location: event.location,
    format: event.format,
    requirements: event.requirements,
    contactEmail: event.contactEmail,
    contactPhone: event.contactPhone,
    teamName: event.teamName,
    organizerId: event.organizerId,
  }
}
}
