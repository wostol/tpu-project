import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { LevelsService } from "./levels.service";
import { LevelResponseDto } from "./dto/level-response.dto";

/**
 * LevelsController — HTTP-слой уровней программы «Сибирские Львы».
 *
 * Endpoint'ы (под /api/*, глобальный префикс задаётся в main.ts):
 *   GET /levels — список уровней.
 *
 * Почему @Public(): JwtAuthGuard зарегистрирован глобально (APP_GUARD),
 * а правила программы должны быть видны и гостю — публичная страница
 * /levels «Правила и уровни» не требует авторизации. Тот же список
 * уровней использует и личный кабинет (карточка уровня, лестница
 * достижений), там JWT и так есть — эндпоинт один на оба случая.
 */
@ApiTags("levels")
@Controller("levels")
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Список уровней программы лояльности" })
  @ApiResponse({
    status: 200,
    description: "Уровни, отсортированные по возрастанию порога",
    type: [LevelResponseDto],
  })
  async getLevels(): Promise<LevelResponseDto[]> {
    return this.levelsService.getLevels();
  }
}
