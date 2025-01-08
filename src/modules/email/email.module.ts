import { Module } from '@nestjs/common'
import { EmailService } from './email.service'
import { EmailController } from './email.controller'
import { DatabaseModule } from 'modules/database/database.module'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { EnvVars } from 'common/constants/env-vars.constant'

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get(EnvVars.JWT_SECRET),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
