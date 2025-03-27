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
import { Timestamp } from '@google-cloud/firestore'
import { FastifyRequest } from 'fastify'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'
import { createWriteStream, existsSync, mkdirSync } from 'fs'

@Injectable()
export class EventService {
  constructor(private readonly databaseService: DatabaseService) { }

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
    const { startDateTime } = eventDto

    const firestoreTimestamp = new Timestamp(startDateTime.seconds, startDateTime.nanoseconds)

    try {
      const newEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        imageUrl: null,
        title: eventDto.title,
        description: eventDto.description,
        location: eventDto.location,
        startDateTime: firestoreTimestamp,
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

  async updateEvent(userId: string, eventId: string, updateEventDto: UpdateEventDto): Promise<EventDto> {
    if (!eventId) {
      Logger.log('Event ID must be provided in order to update event')
      throw new BadRequestException('Event ID not provided')
    }

    const event = await this.findOne(eventId)
    if (event.ownerId !== userId) {
      Logger.warn('You are not the owner of the event.')
      throw new UnauthorizedException('You are not the owner.')
    }
    const updates: Partial<Event> = {}
    const { startDateTime } = updateEventDto
    if (startDateTime) {
      const firestoreTimestamp = new Timestamp(startDateTime.seconds, startDateTime.nanoseconds)
      updates.startDateTime = firestoreTimestamp
    }

    if (updateEventDto.description) updates.description = updateEventDto.description
    if (updateEventDto.location) updates.location = updateEventDto.location
    if (updateEventDto.maximumUsers) updates.maximumUsers = updateEventDto.maximumUsers
    if (updateEventDto.title) updates.title = updateEventDto.title
    if (updateEventDto.imageUrl) updates.imageUrl = updateEventDto.imageUrl

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

  async updateEventImage(eventId: string, userId: string, req: FastifyRequest) {
    const file = await req.file()
    if (!file) throw new BadRequestException('File must be uploaded')

    const ext = extname(file.filename).toLowerCase()
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      throw new BadRequestException('Only image files are allowed (jpg, jpeg, png)')
    }

    const uploadDir = join(__dirname, '../../files') // Adjusted for production
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    const uniqueFilename = `image-${Date.now()}-${randomUUID()}${ext}`
    const filePath = join(__dirname, '../../files', uniqueFilename)

    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(filePath)
      file.file.pipe(writeStream)
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })

    const updateEventDto: UpdateEventDto = { imageUrl: filePath }
    return this.updateEvent(userId, eventId, updateEventDto)
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

  async getEventByUserId(userId: string): Promise<EventDto[]> {
    return this.databaseService.findEventsByUserId<Event>(userId)
  }
}
