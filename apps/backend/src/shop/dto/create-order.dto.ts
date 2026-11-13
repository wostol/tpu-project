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
  productId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

/** Тело POST /api/shop/checkout */
export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}
