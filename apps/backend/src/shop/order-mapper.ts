import { Injectable } from "@nestjs/common";
import { Order, OrderItem } from "@prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

/**
 * OrderMapper — единое место, где заказ из БД превращается в ответ API.
 *
 * Две формы:
 *  - toSummary — для списка заказов (компактная, без массива позиций);
 *  - toDetail  — для страницы заказа (с полным составом items).
 *
 * Используется и ShopService, и ProfileService, поэтому вынесен
 * из сервисов (SRP: сервисы не знают формат ответа).
 */
@Injectable()
export class OrderMapper {
  toSummary(order: OrderWithItems) {
    const first = order.items[0];

    return {
      id: order.id,
      status: order.status,
      date: this.fmtDate(order.createdAt),
      time: this.fmtTime(order.createdAt),
      totalPoints: order.totalPoints,
      itemsCount: order.items.length,
      coverImage: first?.image ?? null,
      coverName: first?.name ?? "Заказ",
    };
  }

  toDetail(order: OrderWithItems) {
    return {
      ...this.toSummary(order),
      items: order.items.map((i) => ({
        id: i.id,
        name: i.name,
        image: i.image,
        points: i.points,
        quantity: i.quantity,
        linePoints: i.linePoints,
      })),
    };
  }

  private fmtDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}`;
  }

  private fmtTime(d: Date): string {
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes(),
    ).padStart(2, "0")}`;
  }
}
