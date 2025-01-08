import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'password123',
    description: 'Current password. Must be at least 6 characters long.',
  })
  @IsString()
  @MinLength(6)
  currentPassword: string

  @ApiProperty({
    example: 'password123',
    description: 'New password. Must be at least 6 characters long.',
  })
  @IsString()
  @MinLength(6)
  newPassword: string
}
