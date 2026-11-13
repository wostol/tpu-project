import { PrismaService } from "../prisma/prisma.service";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderMapper } from "./order-mapper";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderMapper: OrderMapper,
  ) {}

  async getAll() {
    return this.prisma.shopItem.findMany();
  }

  async getById(id: number) {
    return this.prisma.shopItem.findUnique({ where: { id } });
  }

  async createOrder(userId: number, dto: CreateOrderDto) {
    // 1. Собираем снапшоты всех позиций из каталога
    const snapshots = await Promise.all(
      dto.items.map(async (i) => {
        const product = await this.prisma.shopItem.findUnique({
          where: { id: i.itemId },
        });
        if (!product) {
          throw new NotFoundException(`Товар ${i.itemId} не найден`);
        }
        return {
          productId: product.id,
          name: product.name,
          image: product.image ?? "/img/placeholder.webp", // ← fallback для null
          points: product.points,
          quantity: i.quantity,
          linePoints: product.points * i.quantity,
        };
      }),
    );

    const totalPoints = snapshots.reduce((s, i) => s + i.linePoints, 0);

    // 2. Транзакция: создать заказ + списать баллы + запись в историю
    const order = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.totalPoints < totalPoints) {
        throw new BadRequestException(
          "Недостаточно баллов для оформления заказа",
        );
      }

      const created = await tx.order.create({
        data: {
          userId,
          totalPoints,
          status: "completed",
          items: { create: snapshots },
        },
        include: { items: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: { totalPoints: { decrement: totalPoints } },
      });

      await tx.pointsHistory.create({
        data: {
          userId,
          points: -totalPoints, // ← было amount, стало points
          reason: `Заказ №${created.id}`,
        },
      });

      return created;
    });

    return this.orderMapper.toDetail(order);
  }
}
