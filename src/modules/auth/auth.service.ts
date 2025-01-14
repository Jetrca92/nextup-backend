import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'utils/bcrypt'
import { JwtPayloadDto } from 'modules/auth/dto/jwt-payload.dto'
import { UserDto } from '../user/dto/user.dto'
import { UserRegisterDto } from './dto/user-register.dto'
import { UserService } from 'modules/user/user.service'
import { EmailService } from 'modules/email/email.service'
import { DatabaseService } from 'modules/database/database.service'
import { User } from 'models/user.model'

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private jwtService: JwtService,
    private userService: UserService,
    private emailService: EmailService,
  ) {}

  async register(dto: UserRegisterDto): Promise<UserDto> {
    const hashedPassword = await bcrypt.hash(dto.password)
    return this.userService.create({
      ...dto,
      password: hashedPassword,
    })
  }

  async login(user: UserDto): Promise<{ access_token: string }> {
    const payload: JwtPayloadDto = { email: user.email, sub: user.id }
    Logger.log(`User with id ${user.id} successfully logged in`)
    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.databaseService.findOneByField<User>('users', 'email', email)

    if (!user) {
      Logger.warn(`User with email ${email} not found`)
      throw new NotFoundException(`Invalid credentials`)
    }

    const isMatch = await bcrypt.compareHash(password, user.password)
    if (!isMatch) {
      Logger.warn('Passwords do not match')
      throw new BadRequestException('Invalid credentials.')
    }

    Logger.log(`User with email ${email} validated.`)
    return user as UserDto
  }

  async validateGoogleUser(googleUser: UserRegisterDto): Promise<UserDto> {
    const user = await this.databaseService.findOneByField<User>('users', 'email', googleUser.email)

    if (!user) {
      const hashedPassword = await bcrypt.hash(googleUser.password, 10)
      return this.userService.create({
        ...googleUser,
        password: hashedPassword,
      })
    }
    return user
  }

  async forgotPassword(id: string): Promise<void> {
    const user = await this.databaseService.findOneById<User>('users', id)

    if (!user) {
      Logger.warn(`No user found with id: ${id}`)
      throw new NotFoundException(`Invalid credentials`)
    }
    await this.emailService.sendResetPasswordLink(user.email)
  }
}
