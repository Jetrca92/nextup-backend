import { Module } from '@nestjs/common'
import { DatabaseModule } from 'modules/database/database.module'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { DatabaseService } from 'modules/database/database.service'

@Module({
  imports: [DatabaseModule],
  providers: [UserService, DatabaseService],
  controllers: [UserController],
})
export class UserModule {}
