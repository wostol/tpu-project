import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ShopService } from "./shop.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("shop")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("shop")
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Список товаров" })
  getAll() {
    return this.shopService.getAll();
  }

  @Get(":id")
  @Public()
  getById(@Param("id", ParseIntPipe) id: number) {
    return this.shopService.getById(id);
  }

  /** Единственный эндпоинт оформления заказа. */
  @Post("checkout")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Оформление заказа со списанием баллов" })
  checkout(@CurrentUser("id") userId: number, @Body() dto: CreateOrderDto) {
    return this.shopService.createOrder(userId, dto);
  }
}
