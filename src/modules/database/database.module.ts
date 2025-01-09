import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as admin from 'firebase-admin'
import { readFileSync } from 'fs'

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const serviceAccount = JSON.parse(readFileSync('./config/firebase-service-account.json', 'utf8'))
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: configService.get<string>('DATABASE_URL'),
        })
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class DatabaseModule {}
