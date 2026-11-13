import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/**
 * Глобальный модуль Prisma.
 * @Global() — чтобы не импортировать PrismaModule в каждый FeatureModule.
 * Любой сервис может просто запросить `PrismaService` через DI.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
