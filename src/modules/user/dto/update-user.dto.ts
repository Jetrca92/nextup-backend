import { PartialType } from '@nestjs/mapped-types'
import { UserRegisterDto } from 'modules/auth/dto/user-register.dto'

export class UpdateUserDto extends PartialType(UserRegisterDto) {}
