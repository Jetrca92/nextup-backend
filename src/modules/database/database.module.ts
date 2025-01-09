import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { DatabaseService } from './database.service'
import { EnvVars } from 'common/constants/env-vars.constant'

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const serviceAccountPath = configService.get<string>(EnvVars.FIREBASE_SERVICE_ACCOUNT_PATH)
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: configService.get<string>(EnvVars.DATABASE_URL),
        })
      },
    },
    {
      provide: 'FIRESTORE',
      inject: ['FIREBASE_ADMIN'],
      useFactory: (firebaseAdmin: admin.app.App) => firebaseAdmin.firestore(),
    },
    {
      provide: DatabaseService,
      useClass: DatabaseService,
    },
  ],
  exports: ['FIREBASE_ADMIN', 'FIRESTORE', DatabaseService],
})
export class DatabaseModule {}
