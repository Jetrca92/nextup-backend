import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { EventService } from './event.service'
import { DatabaseService } from 'modules/database/database.service'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { EventDto } from './dto/event.dto'
import { AuthGuard } from '@nestjs/passport'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { FastifyRequest } from 'fastify'

@ApiTags('events')
@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private databaseService: DatabaseService,
  ) { }

  @ApiOperation({ summary: 'Return list of upcoming events by date ascending' })
  @ApiResponse({ status: 200, description: 'List of upcoming events', type: [EventDto] })
  @Get('')
  @HttpCode(HttpStatus.OK)
  async getEvents(): Promise<EventDto[]> {
    const eventsSnapshot = await this.databaseService.getCollection('events').orderBy('startDateTime', 'asc').get()
    const events = eventsSnapshot.docs.map((doc) => doc.data() as EventDto)
    return events
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return a list of user events' })
  @ApiResponse({ status: 200, description: 'List of latest user events', type: [EventDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard('jwt'))
  @Get('user-events')
  @HttpCode(HttpStatus.OK)
  async getUserEvents(@GetCurrentUserById() userId: string): Promise<EventDto[]> {
    return this.eventService.getEventByUserId(userId)
  }

  @ApiOperation({ summary: 'Return an event based on id' })
  @ApiResponse({ status: 200, description: 'Event', type: EventDto })
  @ApiParam({
    name: 'eventId',
    description: 'The ID of the event',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(AuthGuard('jwt'))
  @Get(':eventId')
  @HttpCode(HttpStatus.OK)
  async getEventById(@Param('eventId') eventId: string): Promise<EventDto> {
    return this.eventService.getEventById(eventId)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async addEvent(@GetCurrentUserById() userId: string, @Body() eventDto: CreateEventDto): Promise<EventDto> {
    return this.eventService.createEvent(eventDto, userId)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload event image' })
  @ApiResponse({ status: 201, description: 'Image successfully uploaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('/upload/:id')
  @HttpCode(HttpStatus.CREATED)
  async uploadEventImage(
    @GetCurrentUserById() userId: string,
    @Param('id') eventId: string,
    @Req() req: FastifyRequest,
  ): Promise<EventDto> {
    return this.eventService.updateEventImage(eventId, userId, req)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event information' })
  @ApiResponse({ status: 200, description: 'Updated event', type: EventDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({
    name: 'eventId',
    description: 'The ID of the event',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':eventId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateLocation(
    @Param('eventId') eventId: string,
    @GetCurrentUserById() userId: string,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<EventDto> {
    return this.eventService.updateEvent(userId, eventId, updateEventDto)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Deleted event' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({
    name: 'eventId',
    description: 'The ID of the event',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':eventId')
  @HttpCode(HttpStatus.OK)
  async deleteEvent(@Param('eventId') eventId: string, @GetCurrentUserById() userId: string): Promise<EventDto> {
    return this.eventService.deleteEvent(eventId, userId)
  }
}
