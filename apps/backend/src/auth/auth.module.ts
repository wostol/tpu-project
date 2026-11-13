import { Module, Global } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard'

/**
 * AuthModule — собирает всю инфраструктуру аутентификации.
 *
 * @Global() — JwtService, AuthService и OptionalJwtAuthGuard доступны
 * в любом модуле без явного импорта.
 *
 * JwtModule.registerAsync — секреты берутся из ConfigService (не хардкод).
 * PassportModule с default стратегией 'jwt'.
 *
 * OptionalJwtAuthGuard регистрируется здесь (а не в CommonModule),
 * потому что ему нужен JwtService из JwtModule — это лучший DI-scope.
 */
@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTtl') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OptionalJwtAuthGuard],
  exports: [AuthService, JwtModule, OptionalJwtAuthGuard],
})
export class AuthModule {}
