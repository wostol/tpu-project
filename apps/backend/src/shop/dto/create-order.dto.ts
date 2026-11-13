import { Type } from "class-transformer";
import {
  IsArray,
  ArrayNotEmpty,
  IsInt,
  Min,
  ValidateNested,
} from "class-validator";

/** Одна позиция заказа: какой товар и сколько штук. */
export class OrderItemInputDto {
  @IsInt()
  itemId!: number; // ← добавлен !

  @IsInt()
  @Min(1)
  quantity!: number; // ← добавлен !
}
export class CheckoutItemDto {
  @IsInt()
  productId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

/** Тело POST /api/shop/orders */
export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[]; // ← добавлен !
}
