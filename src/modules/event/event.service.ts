import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { DatabaseService } from 'modules/database/database.service'
import { CreateEventDto } from './dto/create-event.dto'
import { EventDto } from './dto/event.dto'
import { Event } from 'models/event.model'

@Injectable()
export class EventService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createEvent(eventDto: CreateEventDto, userId: string): Promise<EventDto> {
    if (!userId) {
      Logger.warn('UserId not provided while creating a new location.')
      throw new UnauthorizedException('User must be authenticated to create a new location.')
    }
    try {
      const newEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        imageUrl: null,
        title: eventDto.title,
        description: eventDto.description,
        location: eventDto.location,
        startDateTime: eventDto.startDateTime,
        maximumUsers: eventDto.maximumUsers,
        ownerId: userId,
      }

      const newEventId = await this.databaseService.addDocument('events', newEvent)
      Logger.log(`New Event ${eventDto.title} successfully created`)
      return { id: newEventId, ...newEvent } as EventDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Something went wrong while creating a new user.')
    }
  }

  async getEventById(eventId: string): Promise<EventDto> {
    const event = await this.databaseService.findOneById<Event>('events', eventId)

    if (!event) {
      Logger.warn(`Event with ID ${eventId} not found.`)
      throw new NotFoundException('Event not found.')
    }

    const eventDto: EventDto = {
      id: event.id,
      imageUrl: event.imageUrl,
      title: event.title,
      description: event.description,
      location: event.location,
      startDateTime: event.startDateTime,
      maximumUsers: event.maximumUsers,
      ownerId: event.ownerId,
      attendees: event.attendees,
    }
    return eventDto
  }
}
