import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { DatabaseModule } from 'modules/database/database.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { EnvVars } from 'common/constants/env-vars.constant'
import { JwtStrategy } from './jwt/jwt.strategy'
import { UserService } from 'modules/user/user.service'
import googleOauthConfig from './config/google-oauth.config'
import { GoogleStrategy } from './strategies/google.strategy'
import { EmailService } from 'modules/email/email.service'

@Module({
  imports: [
    ConfigModule,
    ConfigModule.forFeature(googleOauthConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get(EnvVars.JWT_SECRET),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    DatabaseModule,
  ],
  providers: [AuthService, JwtStrategy, UserService, GoogleStrategy, EmailService],
  controllers: [AuthController],
})
export class AuthModule {}
