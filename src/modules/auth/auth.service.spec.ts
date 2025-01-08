import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { UserService } from 'modules/user/user.service'
import { JwtService } from '@nestjs/jwt'
import { DatabaseService } from 'modules/database/database.service'
import { UserRegisterDto } from './dto/user-register.dto'
import * as bcrypt from 'utils/bcrypt'
import { hash } from 'utils/bcrypt'
import { UserDto } from 'modules/user/dto/user.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'

jest.mock('bcrypt')

describe('AuthService', () => {
  let authService: AuthService
  let userService: UserService
  let jwtService: JwtService
  let databaseService: DatabaseService

  beforeEach(async () => {
    const mockUserService = {
      create: jest.fn(),
    }

    const mockJwtService = {
      sign: jest.fn(),
    }

    const mockDatabaseService = {
      user: {
        findUnique: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
    userService = module.get<UserService>(UserService)
    jwtService = module.get<JwtService>(JwtService)
    databaseService = module.get<DatabaseService>(DatabaseService)
  })

  describe('register', () => {
    it('should successfully register a user', async () => {
      const dto: UserRegisterDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      }
      const hashedPassword = 'hashedPassword'
      const userId = '258ba836-5c34-4e46-bf6e-899a46b780de'
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword)
      jest.spyOn(userService, 'create').mockResolvedValue({ ...dto, id: userId, password: hashedPassword } as UserDto)

      const result = await authService.register(dto)

      expect(result).toEqual({ ...dto, id: userId, password: hashedPassword })
      expect(userService.create).toHaveBeenCalledWith({ ...dto, password: hashedPassword })
    })
  })

  describe('login', () => {
    it('should successfully login a user and return a token', async () => {
      const user: UserDto = {
        id: '258ba836-5c34-4e46-bf6e-899a46b780de',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }
      const token = 'accessToken'

      jest.spyOn(jwtService, 'sign').mockReturnValue(token)

      const result = await authService.login(user)

      expect(result).toEqual({ access_token: token })
      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id })
    })
  })

  describe('validateUser', () => {
    it('should throw NotFoundException if user not found', async () => {
      const email = 'nonexistent@example.com'
      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null)

      await expect(authService.validateUser(email, 'password')).rejects.toThrow(NotFoundException)
      await expect(authService.validateUser(email, 'password')).rejects.toThrow(`User with email ${email} not found`)
    })

    it('should throw BadRequestException if passwords do not match', async () => {
      const user = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'http://exapmle.com/avatar.jpg',
        id: '044740a9-2f5d-4e97-9afb-dc48f400164a',
        createdAt: new Date(),
        updatedAt: new Date(),
        points: 10,
      }
      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(user)
      jest.spyOn(bcrypt, 'compareHash').mockResolvedValue(false)

      await expect(authService.validateUser(user.email, 'wrongPassword')).rejects.toThrow(BadRequestException)
      await expect(authService.validateUser(user.email, 'wrongPassword')).rejects.toThrow('Passwords do not match')
    })

    it('should successfully validate user and return user data', async () => {
      const password = 'password'
      const hashedPassword = await hash(password, 10)
      const date = new Date()

      const user = {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'http://exapmle.com/avatar.jpg',
        id: '044740a9-2f5d-4e97-9afb-dc48f400164a',
        createdAt: date,
        updatedAt: date,
        points: 10,
      }
      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(user)
      jest.spyOn(bcrypt, 'compareHash').mockResolvedValue(true)

      const result = await authService.validateUser(user.email, password)

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: 'http://exapmle.com/avatar.jpg',
        points: 10,
        createdAt: date,
        updatedAt: date,
      })
      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email: user.email },
        select: expect.anything(),
      })
    })
  })
})
