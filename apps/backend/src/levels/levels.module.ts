import { Module } from "@nestjs/common";
import { LevelsController } from "./levels.controller";
import { LevelsService } from "./levels.service";

/**
 * LevelsModule — уровни программы лояльности.
 *
 * PrismaModule глобальный (@Global), поэтому PrismaService
 * доступен LevelsService без явного импорта.
 */
@Module({
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService],
})
export class LevelsModule {}
