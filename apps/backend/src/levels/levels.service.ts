import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Level } from "@prisma/client";
import { LevelResponseDto } from "./dto/level-response.dto";

/**
 * LevelsService — бизнес-логика уровней программы «Сибирские Львы».
 *
 * Ответственность:
 *   - Отдать уровни, отсортированные по порогу
 *     (от «Львёнка» 0 баллов к «Сибирскому льву» 5000 баллов)
 *
 * Не отвечает за:
 *   - HTTP-слой (это LevelsController)
 *   - Начисление баллов (происходит при обработке событий)
 *   - Вычисление текущего уровня пользователя:
 *     фронт сравнивает User.totalPoints с порогами уровней сам,
 *     поэтому отдельный GET /levels/me не нужен.
 *
 * Workflow: Controller → Service → PrismaService (прямой доступ,
 * как в UsersService — данных мало, Repository не требуется).
 */
@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Список уровней по возрастанию порога minPoints.
   *
   * Публичные данные: у модели Level нет секретных полей, поэтому
   * маппинг сводится к явному набору полей (без id из будущих таблиц
   * и без лишних данных наружу).
   *
   * Если таблица пуста — вернётся []. Фронт в этом случае показывает
   * локальный фолбэк (LEVELS_FALLBACK), страница правил не бывает пустой.
   */
  async getLevels(): Promise<LevelResponseDto[]> {
    const levels = await this.prisma.level.findMany({
      orderBy: { minPoints: "asc" },
    });

    return levels.map((level) => this.toResponse(level));
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Маппинг Prisma-модели Level в LevelResponseDto.
   * Фронт ждёт minPoints (camelCase); поле description может быть null.
   */
  private toResponse(level: Level): LevelResponseDto {
    return {
      id: level.id,
      name: level.name,
      minPoints: level.minPoints,
      description: level.description,
      color: level.color,
    };
  }
}
