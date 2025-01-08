import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator'

export class UserDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the user',
    format: 'uuid',
  })
  @IsUUID()
  id: string

  @ApiProperty({ example: 'user@example.com', description: 'Email of the user' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'Harry', description: 'First name of the user' })
  @IsString()
  firstName: string

  @ApiProperty({ example: 'Potter', description: 'Last name of the user' })
  @IsString()
  lastName: string

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL to the users avatar image' })
  @IsString()
  @IsOptional()
  avatarUrl?: string
}
