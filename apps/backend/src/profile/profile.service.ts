import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OrderMapper } from "../shop/order-mapper";

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderMapper: OrderMapper,
  ) {}

  /** Список заказов — компактные summary без массива позиций. */
  async getOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: { orderBy: { id: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => this.orderMapper.toSummary(o));
  }

  /** Детали одного заказа — только своего (иначе NotFound, не 403). */
  async getOrderById(id: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { orderBy: { id: "asc" } } },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException("Заказ не найден");
    }
    return this.orderMapper.toDetail(order);
  }

  async getPoints(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.pointsHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.pointsHistory.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getPointsHistory(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [records, total] = await this.prisma.$transaction([
      this.prisma.pointsHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.pointsHistory.count({ where: { userId } }),
    ]);

    return { data: records, total, page, limit };
  }
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Пользователь не найден");

    const levels = await this.prisma.level.findMany({
      orderBy: { minPoints: "asc" },
    });

    // Текущий уровень — максимальный, чей порог не выше баланса
    const currentLevel =
      [...levels].reverse().find((l) => l.minPoints <= user.totalPoints) ??
      levels[0] ??
      null;

    // Собираем ФИО из частей (в схеме User поля firstName/lastName/middleName)
    const fullName =
      [user.lastName, user.firstName, user.middleName]
        .filter(Boolean)
        .join(" ") || user.username;

    return {
      id: user.id,
      email: user.email,
      fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      username: user.username,
      group: user.group,
      faculty: user.faculty,
      role: user.role,
      totalPoints: user.totalPoints,

      // snake_case — чтобы PointsTab/AchievementsTab читали без маппинга
      level: currentLevel
        ? {
            id: currentLevel.id,
            name: currentLevel.name,
            min_points: currentLevel.minPoints,
            color: (currentLevel as any).color ?? "#003466",
            bonus_percent: (currentLevel as any).bonusPercent ?? 0,
            privileges: (currentLevel as any).privileges ?? [],
            description: (currentLevel as any).description ?? "",
          }
        : null,

      levels: levels.map((l) => ({
        id: l.id,
        name: l.name,
        min_points: l.minPoints,
        color: (l as any).color ?? "#003466",
        description: (l as any).description ?? "",
        bonus_percent: (l as any).bonusPercent ?? 0,
      })),
    };
  }
}
