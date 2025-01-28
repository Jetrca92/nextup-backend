import {
  BadRequestException,
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
import { UpdateEventDto } from './dto/update-event.dto'
import { DatabaseCollections } from 'common/constants/firebase-vars.constant'

@Injectable()
export class EventService {
  constructor(private readonly databaseService: DatabaseService) {}

  private toEventDto(event: Event): EventDto {
    return {
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
  }

  async findOne(eventId: string): Promise<Event> {
    const event = await this.databaseService.findOneById<Event>(DatabaseCollections.EVENTS, eventId)

    if (!event) {
      Logger.warn(`Event with ID ${eventId} not found.`)
      throw new NotFoundException('Event not found.')
    }
    return event
  }

  async createEvent(eventDto: CreateEventDto, userId: string): Promise<EventDto> {
    if (!userId) {
      Logger.warn('UserId not provided while creating a new event.')
      throw new UnauthorizedException('User must be authenticated to create a new event.')
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

      const newEventId = await this.databaseService.addDocument(DatabaseCollections.EVENTS, newEvent)
      Logger.log(`New Event ${eventDto.title} successfully created`)
      return { id: newEventId, ...newEvent } as EventDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Something went wrong while creating a new event.')
    }
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto): Promise<EventDto> {
    if (!eventId) {
      Logger.log('Event ID must be provided in order to update event')
      throw new BadRequestException('Event ID not provided')
    }

    const updates: Partial<EventDto> = {}

    if (updateEventDto.description) updates.description = updateEventDto.description
    if (updateEventDto.location) updates.location = updateEventDto.location
    if (updateEventDto.maximumUsers) updates.maximumUsers = updateEventDto.maximumUsers
    if (updateEventDto.startDateTime) updates.startDateTime = updateEventDto.startDateTime
    if (updateEventDto.title) updates.title = updateEventDto.title

    if (Object.keys(updates).length === 0) {
      Logger.warn('No fields to update.')
      throw new BadRequestException('No fields to update.')
    }

    try {
      const updatedEvent = await this.databaseService.updateDocument<Event>(
        DatabaseCollections.EVENTS,
        eventId,
        updates,
      )
      Logger.log(`Event with ID ${eventId} updated successfully.`)
      return this.toEventDto(updatedEvent)
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to update event.')
    }
  }

  async deleteEvent(eventId: string, userId: string): Promise<EventDto> {
    const event = await this.findOne(eventId)

    if (event.ownerId !== userId) {
      Logger.warn(`User with ID ${userId} is not the owner of event with ID ${eventId}. Event delete failed.`)
      throw new UnauthorizedException('You are not authorized to delete this event.')
    }

    try {
      await this.databaseService.deleteDocument(DatabaseCollections.EVENTS, eventId)
      Logger.log(`Event with id ${eventId} deleted`)
      return this.toEventDto(event)
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to delete event from database.')
    }
  }

  async getEventById(eventId: string): Promise<EventDto> {
    const event = await this.findOne(eventId)
    return this.toEventDto(event)
  }
}
