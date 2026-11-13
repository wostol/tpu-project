import { Module } from "@nestjs/common";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { ShopModule } from "../shop/shop.module";

@Module({
  imports: [ShopModule], // даёт доступ к OrderMapper
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
