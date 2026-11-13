import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthUser } from "../common/interfaces/auth-user.interface";

@ApiTags("profile")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("profile")
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get("orders")
  getOrders(@CurrentUser() user: AuthUser) {
    return this.profileService.getOrders(user.id);
  }

  @Get("orders/:id")
  getOrder(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.profileService.getOrderById(id, user.id);
  }

  @Get("points")
  @UseGuards(JwtAuthGuard)
  getPointsHistory(
    @CurrentUser("id") userId: number,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.profileService.getPointsHistory(
      userId,
      Math.max(1, Number(page) || 1),
      Math.min(50, Math.max(1, Number(limit) || 10)),
    );
  }
  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser("id") userId: number) {
    return this.profileService.getMe(userId);
  }
}
