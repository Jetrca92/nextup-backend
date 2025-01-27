import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { EventService } from './event.service'
import { DatabaseService } from 'modules/database/database.service'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { EventDto } from './dto/event.dto'

@Controller('event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private databaseService: DatabaseService,
  ) {}

  @ApiOperation({ summary: 'Return list of upcoming events by date ascending' })
  @ApiResponse({ status: 200, description: 'List of upcoming events', type: [EventDto] })
  @Get('')
  @HttpCode(HttpStatus.OK)
  async getEvents(): Promise<EventDto[]> {
    const eventsSnapshot = await this.databaseService.getCollection('events').orderBy('startDateTime', 'asc').get()
    const events = eventsSnapshot.docs.map((doc) => doc.data() as EventDto)
    return events
  }
}
