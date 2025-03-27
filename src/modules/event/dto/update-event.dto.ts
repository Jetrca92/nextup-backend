import { PartialType } from '@nestjs/mapped-types'
import { CreateEventDto } from './create-event.dto'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiProperty({ example: 'image.jpg', description: 'Image url' })
  @IsString()
  @IsOptional()
  imageUrl?: string
}
