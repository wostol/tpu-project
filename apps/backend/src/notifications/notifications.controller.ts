import { Controller, Get, Put, Delete, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthUser } from '../common/interfaces/auth-user.interface'

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifService: NotificationsService) {}

  @Get()
  getAll(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    return this.notifService.getAll(user.id, limit ? parseInt(limit) : 50)
  }

  @Put(':id/read')
  markAsRead(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.notifService.markAsRead(user.id, id)
  }

  @Put('read-all')
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notifService.markAllAsRead(user.id)
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.notifService.delete(user.id, id)
  }
}