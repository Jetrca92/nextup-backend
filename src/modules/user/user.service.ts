import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { UserRegisterDto } from 'modules/auth/dto/user-register.dto'
import { UserDto } from 'modules/user/dto/user.dto'
import { DatabaseService } from 'modules/database/database.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdatePasswordDto } from './dto/update-password.dto'
import * as bcrypt from 'utils/bcrypt'

@Injectable()
export class UserService {
  constructor(private prisma: DatabaseService) {}

  async create(createUserDto: UserRegisterDto): Promise<UserDto> {
    if (!createUserDto.email || !createUserDto.password) {
      Logger.warn('Email and password are required for creating user.')
      throw new BadRequestException('Email and password are required.')
    }
    const user = await this.prisma.user.findUnique({ where: { email: createUserDto.email } })
    if (user) {
      Logger.warn('User with that email already exists')
      throw new BadRequestException('User with that email already exists.')
    }
    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: createUserDto.password,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          avatarUrl: createUserDto.avatarUrl,
        },
      })

      delete newUser.password
      Logger.log(`User successfully created for email ${createUserDto.email}`)
      return newUser as UserDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Something went wrong while creating a new user.')
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = (await this.prisma.user.findUnique({ where: { id } })) as UserDto
    const updates: Partial<UserDto> = {}

    if (user.email !== updateUserDto.email && updateUserDto.email) {
      updates.email = updateUserDto.email
    }

    if (updateUserDto.firstName) updates.firstName = updateUserDto.firstName
    if (updateUserDto.lastName) updates.lastName = updateUserDto.lastName

    if (Object.keys(updates).length === 0) {
      Logger.warn('No fields to update.')
      throw new BadRequestException('No fields to update.')
    }

    Logger.log(`User updated successfully for user ID ${id}.`)
    return this.prisma.user.update({
      where: { id },
      data: updates,
    })
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      Logger.warn(`User with ID ${id} not found.`)
      throw new BadRequestException('User not found')
    }
    if (!(await bcrypt.compareHash(updatePasswordDto.currentPassword, user.password))) {
      Logger.warn(`Incorrect current password for user ID ${id}.`)
      throw new BadRequestException('Incorrect current password')
    }
    if (!updatePasswordDto.newPassword) {
      Logger.warn('New password must be provided.')
      throw new BadRequestException('New password must be provided.')
    }
    if (updatePasswordDto.newPassword === updatePasswordDto.currentPassword) {
      Logger.warn('New password cannot be the same as the current password.')
      throw new BadRequestException('New password cannot be the same as the current password')
    }
    if (updatePasswordDto.newPassword.length < 6) {
      Logger.warn('Password must be at least 6 characters long')
      throw new BadRequestException('Password must be at least 6 characters long')
    }
    const hashedNewPassword = await bcrypt.hash(updatePasswordDto.newPassword)
    if (!hashedNewPassword) {
      Logger.error('Error hashing the new password.')
      throw new InternalServerErrorException('Failed to update password')
    }

    const updatedUser = (await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
      },
    })) as UserDto

    Logger.log(`Password updated successfully for user ID ${id}.`)
    return updatedUser
  }
}
