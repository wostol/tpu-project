import { ApiProperty } from "@nestjs/swagger";

/**
 * LevelResponseDto — уровень программы «Сибирские Львы».
 *
 * БД хранит все правила уровня: порог, название, цвет, описание,
 * процент бонуса к физ-ре и приз. Страница /levels и вкладки профиля
 * рендерят таблицу уровней целиком из ответа API; локальный фолбэк
 * на фронте (LEVELS_FALLBACK) нужен только когда бэкенд недоступен.
 */
export class LevelResponseDto {
  @ApiProperty({ example: 1, description: "ID уровня" })
  id!: number;

  @ApiProperty({ example: "Золотой лев", description: "Название уровня" })
  name!: string;

  @ApiProperty({
    example: 3500,
    description: "Порог уровня в баллах (minPoints)",
  })
  minPoints!: number;

  @ApiProperty({
    example: "Скидка 10% в магазине мерча",
    description: "Описание уровня (свободный текст)",
    required: false,
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: 17,
    description: "Бонус к зачёту по физ-ре, % (округление бонуса до 0,5)",
  })
  bonusPercent!: number;

  @ApiProperty({
    example: "Скидка 10% в магазине мерча",
    description: "Приз уровня — колонка «Приз» в таблице на /levels",
    required: false,
    nullable: true,
  })
  prize!: string | null;

  @ApiProperty({ example: "#d4a017", description: "Цвет уровня (HEX)" })
  color!: string;
}
