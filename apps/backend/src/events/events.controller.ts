import { Controller, Get, Param, ParseIntPipe, UseGuards, NotFoundException, Post, Delete, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { EventsService } from './events.service'
import { EventResponseDto } from './dto/event-response.dto'
import { RegisterEventDto} from './dto/register-event.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Public } from '../common/decorators/public.decorator'
import type { AuthUser } from '../common/interfaces/auth-user.interface'

/**
 * EventsController — HTTP-слой мероприятий.
 *
 * ВАЖНО: ПОРЯДОК РОУТОВ ИМЕЕТ ЗНАЧЕНИЕ.
 * @Get('my') должен идти ДО @Get(':id'), иначе NestJS посчитает 'my' как id
 * и упадёт в ParseIntPipe с ошибкой 400.
 *
 * Endpoint'ы (под /api/events/*):
 *   GET /events      — все мероприятия (public, но если есть JWT — с isRegistered)
 *   GET /events/my   — мои мероприятия (требует JWT)
 *   GET /events/:id  — одно мероприятие (public, но если есть JWT — с isRegistered)
 *
 * @Public() стоит на getAllEvents и getById, потому что JwtAuthGuard
 * зарегистрирован глобально. Запросы без токена проходят — user будет undefined.
 */
@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Все мероприятия' })
  @ApiResponse({ status: 200, description: 'Список мероприятий', type: [EventResponseDto] })
  async getAllEvents(@CurrentUser() user?: AuthUser): Promise<EventResponseDto[]> {
    return this.eventsService.getAllEvents(user?.id ?? null)
  }

  // ВАЖНО: 'my' ДО ':id' — иначе 'my' парсится как число и падает в 400
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Мои мероприятия (на которые я зарегистрирован)' })
  @ApiResponse({ status: 200, description: 'Список мероприятий', type: [EventResponseDto] })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getMyEvents(@CurrentUser() user: AuthUser): Promise<EventResponseDto[]> {
    return this.eventsService.getMyEvents(user.id)
  }

  @Get(':id')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Одно мероприятие по id' })
  @ApiResponse({ status: 200, description: 'Мероприятие', type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Не найдено' })
  async getEventById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<EventResponseDto> {
    const event = await this.eventsService.getEventById(id, user?.id ?? null)
    if (!event) {
      throw new NotFoundException(`Мероприятие #${id} не найдено`)
    }
    return event
  }
  @Post(':id/register')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Зарегистрироваться на мероприятие' })
async register(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: RegisterEventDto,
  @CurrentUser() user: AuthUser,
) {
  return this.eventsService.registerUser(user.id, id, dto.registrationType)
}

@Delete(':id/unregister')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Отписаться от мероприятия' })
async unregister(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: AuthUser,
) {
  return this.eventsService.unregisterUser(user.id, id)
}

}
