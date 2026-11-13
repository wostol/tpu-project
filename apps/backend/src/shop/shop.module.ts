import { Module } from "@nestjs/common";
import { ShopController } from "./shop.controller";
import { ShopService } from "./shop.service";
import { OrderMapper } from "./order-mapper";

@Module({
  controllers: [ShopController],
  providers: [ShopService, OrderMapper],
  exports: [OrderMapper], // чтобы ProfileModule мог им пользоваться
})
export class ShopModule {}
