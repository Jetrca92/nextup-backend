import { Module } from '@nestjs/common'
import { DatabaseModule } from 'modules/database/database.module'
import { DatabaseService } from 'modules/database/database.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [DatabaseModule],
  providers: [DatabaseService, UserService],
  controllers: [UserController],
})
export class UserModule {}
