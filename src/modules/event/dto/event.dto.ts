import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { User } from 'models/user.model'
import { Timestamp } from '@google-cloud/firestore'

export class EventDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the event',
  })
  @IsString()
  id: string

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL of the event image' })
  @IsString()
  imageUrl: string

  @ApiProperty({ example: 'Oktoberfest', description: 'Event title' })
  @IsString()
  title: string

  @ApiProperty({
    example:
      'Oktoberfest is an eighteen-day festival held every year from the end of September to the beginning of October in Munich. It is one of the most popular events in Germany and, with six million visitors each year, one of the largest festivals in the world.',
    description: 'Event description',
  })
  @IsString()
  description: string

  @ApiProperty({ example: 'München, Germany', description: 'Event location' })
  @IsString()
  location: string

  @ApiProperty({
    example: { seconds: 1672531200, nanoseconds: 0 },
    description: 'Start date and time of the event as a Firestore Timestamp',
  })
  startDateTime: Timestamp

  @IsNumber()
  @Min(1)
  maximumUsers: number

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID of the owner' })
  @IsString()
  ownerId: string

  @ApiProperty({
    example: [
      {
        id: 'user123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    ],
    description: 'List of users attending the event (optional)',
  })
  @IsOptional()
  attendees?: User[]
}
