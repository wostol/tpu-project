import { ApiProperty } from '@nestjs/swagger'

/**
 * LevelResponseDto — уровень программы «Сибирские Львы».
 *
 * В БД (модель Level) хранится только порог, название, цвет и описание.
 * Процент бонуса к физ-ре и приз уровня фронт подставляет из локального
 * справочника (user-site/src/levels/levelsData.js) — так правила
 * программы можно менять без миграций БД.
 */
export class LevelResponseDto {
  @ApiProperty({ example: 1, description: 'ID уровня' })
  id!: number

  @ApiProperty({ example: 'Золотой лев', description: 'Название уровня' })
  name!: string

  @ApiProperty({
    example: 3500,
    description: 'Порог уровня в баллах (minPoints)',
  })
  minPoints!: number

  @ApiProperty({
    example: 'Скидка 10% в магазине мерча',
    description: 'Описание / приз уровня',
    required: false,
    nullable: true,
  })
  description!: string | null

  @ApiProperty({ example: '#d4a017', description: 'Цвет уровня (HEX)' })
  color!: string
}
