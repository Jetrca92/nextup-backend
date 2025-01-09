import { Module } from '@nestjs/common'
import { DatabaseModule } from 'modules/database/database.module'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [DatabaseModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
