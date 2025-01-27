import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString, Min } from 'class-validator'
import { Timestamp } from '@google-cloud/firestore'

export class CreateEventDto {
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
}
