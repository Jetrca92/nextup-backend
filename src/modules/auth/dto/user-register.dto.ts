import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class UserRegisterDto {
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
  @IsOptional()
  @IsString()
  avatarUrl?: string | null

  @ApiProperty({
    example: 'password123',
    description: 'The password for the user account. Must be at least 6 characters long.',
  })
  @IsString()
  @MinLength(6)
  password: string
}
