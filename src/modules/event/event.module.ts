import { Module } from '@nestjs/common'
import { EventService } from './event.service'
import { DatabaseModule } from 'modules/database/database.module'
import { DatabaseService } from 'modules/database/database.service'
import { EventController } from './event.controller'

@Module({
  imports: [DatabaseModule],
  providers: [EventService, DatabaseService],
  controllers: [EventController],
})
export class EventModule {}
