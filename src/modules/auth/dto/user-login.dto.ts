import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class UserLoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email of the user' })
  @IsEmail()
  email: string

  @ApiProperty({
    example: 'password123',
    description: 'The password for the user account. Must be at least 6 characters long.',
  })
  @IsString()
  @MinLength(6)
  password: string
}
