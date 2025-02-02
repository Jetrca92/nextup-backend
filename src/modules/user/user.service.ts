import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { UserRegisterDto } from 'modules/auth/dto/user-register.dto'
import { UserDto } from 'modules/user/dto/user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdatePasswordDto } from './dto/update-password.dto'
import * as bcrypt from 'utils/bcrypt'
import { DatabaseService } from 'modules/database/database.service'
import { UserFirestore } from 'modules/auth/dto/user-firestore.dto'

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: UserRegisterDto): Promise<UserDto> {
    const user = await this.databaseService.findOneByField<UserFirestore>('users', 'email', createUserDto.email)

    if (user) {
      Logger.warn('User with that email already exists')
      throw new BadRequestException('User with that email already exists.')
    }

    try {
      const newUser = {
        email: createUserDto.email,
        password: createUserDto.password,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        avatarUrl: createUserDto.avatarUrl,
      }

      const newUserId = await this.databaseService.addDocument('users', newUser)
      delete newUser.password
      Logger.log(`User successfully created for email ${createUserDto.email}`)
      return { id: newUserId, ...newUser } as UserDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Something went wrong while creating a new user.')
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.databaseService.findOneById<UserFirestore>('users', id)

    if (!user) {
      Logger.warn(`User with ID ${id} not found.`)
      throw new BadRequestException('User not found.')
    }

    const updates: Partial<UserDto> = {}

    if (updateUserDto.email) updates.email = updateUserDto.email
    if (updateUserDto.firstName) updates.firstName = updateUserDto.firstName
    if (updateUserDto.lastName) updates.lastName = updateUserDto.lastName

    if (Object.keys(updates).length === 0) {
      Logger.warn('No fields to update.')
      throw new BadRequestException('No fields to update.')
    }

    try {
      await this.databaseService.updateDocument('users', id, updates)
      const updatedUser = { id, user, ...updates } as UserDto
      Logger.log(`User updated successfully for user ID ${id}.`)
      return updatedUser
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to update user.')
    }
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<UserDto> {
    const user = await this.databaseService.findOneById<UserFirestore>('users', id)

    if (!user) {
      Logger.warn(`User with ID ${id} not found.`)
      throw new BadRequestException('User not found')
    }

    if (!(await bcrypt.compareHash(updatePasswordDto.currentPassword, user.password))) {
      Logger.warn(`Incorrect current password for user ID ${id}.`)
      throw new BadRequestException('Incorrect current password')
    }

    if (updatePasswordDto.newPassword === updatePasswordDto.currentPassword) {
      Logger.warn('New password cannot be the same as the current password.')
      throw new BadRequestException('New password cannot be the same as the current password')
    }

    const hashedNewPassword = await bcrypt.hash(updatePasswordDto.newPassword)
    if (!hashedNewPassword) {
      Logger.error('Error hashing the new password.')
      throw new InternalServerErrorException('Failed to update password')
    }

    try {
      await this.databaseService.updateDocument('users', id, { password: hashedNewPassword })
      const updatedUser = { id, ...user, password: hashedNewPassword } as UserDto
      Logger.log(`Password updated successfully for user ID ${id}.`)
      return updatedUser
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to update password.')
    }
  }
}
