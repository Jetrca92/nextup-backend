import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { UserRegisterDto } from 'modules/auth/dto/user-register.dto'
import { UserDto } from 'modules/user/dto/user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdatePasswordDto } from './dto/update-password.dto'
import * as bcrypt from 'utils/bcrypt'
import { DatabaseService } from 'modules/database/database.service'
import { User } from 'models/user.model'
import { DatabaseCollections } from 'common/constants/firebase-vars.constant'
import { FastifyRequest } from 'fastify'
import { extname, join } from 'path'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) { }

  async create(createUserDto: UserRegisterDto): Promise<UserDto> {
    const user = await this.databaseService.findOneByField<User>(
      DatabaseCollections.USERS,
      'email',
      createUserDto.email,
    )

    if (user) {
      Logger.warn('User with that email already exists')
      throw new BadRequestException('User with that email already exists.')
    }

    try {
      const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        email: createUserDto.email,
        password: createUserDto.password,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        avatarUrl: createUserDto.avatarUrl || null,
        events: null,
      }

      const newUserId = await this.databaseService.addDocument(DatabaseCollections.USERS, newUser)
      Logger.log(`User successfully created for email ${createUserDto.email}`)
      const userDto: UserDto = {
        id: newUserId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        avatarUrl: newUser.avatarUrl,
      }
      return userDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Something went wrong while creating a new user.')
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.databaseService.findOneById<User>(DatabaseCollections.USERS, id)

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
      const updatedUser = await this.databaseService.updateDocument<User>(DatabaseCollections.USERS, id, updates)
      Logger.log(`User updated successfully for user ID ${id}.`)
      const userDto: UserDto = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatarUrl: updatedUser.avatarUrl,
      }
      return userDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to update user.')
    }
  }

  async updateUserImage(userId: string, req: FastifyRequest) {
    const file = await req.file()
    if (!file) throw new BadRequestException('File must be uploaded')

    const ext = extname(file.filename).toLowerCase()
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      throw new BadRequestException('Only image files are allowed (jpg, jpeg, png)')
    }

    const uploadDir = join(__dirname, '../../files') // Adjusted for production
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    const uniqueFilename = `image-${Date.now()}-${randomUUID()}${ext}`
    const filePath = join(__dirname, '../../files', uniqueFilename)

    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(filePath)
      file.file.pipe(writeStream)
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })

    const updateUserDto: UpdateUserDto = { avatarUrl: filePath }
    return this.updateUser(userId, updateUserDto)
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<UserDto> {
    const user = await this.databaseService.findOneById<User>(DatabaseCollections.USERS, id)

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
      await this.databaseService.updateDocument(DatabaseCollections.USERS, id, { password: hashedNewPassword })
      const userDto: UserDto = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      }
      Logger.log(`Password updated successfully for user ID ${id}.`)
      return userDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to update password.')
    }
  }

  async getUserById(userId: string): Promise<UserDto> {
    const user = await this.databaseService.findOneById<User>(DatabaseCollections.USERS, userId)

    if (!user) {
      Logger.warn(`User with ID ${userId} not found.`)
      throw new NotFoundException('User not found.')
    }

    const userDto: UserDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    }
    return userDto
  }
}
