import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getAll(userId: number, limit: number = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async markAsRead(userId: number, id: number) {
    const notif = await this.prisma.notification.findFirst({ where: { id, userId } })
    if (!notif) throw new NotFoundException()
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } })
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
    return { success: true }
  }

  async delete(userId: number, id: number) {
    const notif = await this.prisma.notification.findFirst({ where: { id, userId } })
    if (!notif) throw new NotFoundException()
    await this.prisma.notification.delete({ where: { id } })
    return { success: true }
  }
}