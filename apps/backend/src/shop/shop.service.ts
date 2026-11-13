import { PrismaService } from "../prisma/prisma.service";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderMapper } from "./order-mapper";
import { CreateOrderDto } from "./dto/create-order.dto";

interface OrderItemSnapshot {
  productId: number;
  name: string;
  image: string;
  points: number;
  quantity: number;
  linePoints: number;
}

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
    // 1. Склеиваем дубликаты: [{productId:1,qty:1},{productId:1,qty:2}] → {1: 3}
    const merged = new Map<number, number>();
    for (const item of dto.items) {
      merged.set(
        item.productId,
        (merged.get(item.productId) ?? 0) + item.quantity,
      );
    }

    // 2. Снапшоты по актуальным ценам каталога. Сумму считает ТОЛЬКО сервер:
    // клиент присылает только { productId, quantity }.
    const snapshots: OrderItemSnapshot[] = [];
    let totalPoints = 0;

    for (const [productId, quantity] of merged) {
      const product = await this.prisma.shopItem.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Товар #${productId} не найден`);
      }
      const linePoints = product.points * quantity;
      totalPoints += linePoints;
      snapshots.push({
        productId: product.id,
        name: product.name,
        image: product.image ?? "", // пустая строка — фронт покажет заглушку
        points: product.points,
        quantity,
        linePoints,
      });
    }

    // 3. Транзакция: создать заказ + списать баллы + запись в историю
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
          points: -totalPoints,
          // «Покупка: …» — фронт истории определяет по этому слову тип «Покупка в магазине»
          reason: `Покупка: ${snapshots.map((s) => s.name).join(", ")}`,
        },
      });

      return created;
    });

    return this.orderMapper.toDetail(order);
  }
}
