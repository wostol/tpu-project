import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

/**
 * PrismaService — singleton-обёртка над PrismaClient.
 *
 * Реализует lifecycle-хуки NestJS:
 *   - OnModuleInit → подключение к БД при старте
 *   - OnModuleDestroy → аккуратное отключение при завершении
 *
 * Внедряется как обычный injectable-сервис во всём приложении
 * (через PrismaModule, который @Global).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: ['warn', 'error'],
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
    this.logger.log('✓ Connected to database')
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
    this.logger.log('✓ Disconnected from database')
  }
}
