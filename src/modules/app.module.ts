import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { EmailModule } from './email/email.module'
import { UserModule } from './user/user.module'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.STAGE || 'development'}`,
    }),
    DatabaseModule,
    AuthModule,
    EmailModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
