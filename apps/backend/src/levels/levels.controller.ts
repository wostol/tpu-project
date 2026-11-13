import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { LevelsService } from './levels.service'
import { Public } from '../common/decorators/public.decorator'

@ApiTags('levels')
@Controller('levels')
export class LevelsController {
  constructor(private levelsService: LevelsService) {}

  @Get()
  @Public()
  getAll() { return this.levelsService.getAll() }
}