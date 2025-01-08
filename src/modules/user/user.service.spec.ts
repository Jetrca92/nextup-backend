import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { DatabaseService } from 'modules/database/database.service'
import { UserRegisterDto } from 'modules/auth/dto/user-register.dto'
import { BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { UpdateUserDto } from './dto/update-user.dto'

describe('UserService', () => {
  let service: UserService
  let databaseService: DatabaseService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: DatabaseService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
    databaseService = module.get<DatabaseService>(DatabaseService)
  })

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: UserRegisterDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      }
      const createdUser = {
        ...createUserDto,
        avatarUrl: 'http://exapmle.com/avatar.jpg',
        id: '044740a9-2f5d-4e97-9afb-dc48f400164a',
        createdAt: new Date(),
        updatedAt: new Date(),
        points: 10,
      }
      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null)
      jest.spyOn(databaseService.user, 'create').mockResolvedValue(createdUser)

      const result = await service.create(createUserDto)
      expect(result).toEqual(createdUser)
    })

    it('should throw BadRequestException if email or password is missing', async () => {
      const createUserDto: UserRegisterDto = { email: '', password: '', firstName: 'John', lastName: 'Doe' }
      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException if user with that email exists', async () => {
      const createUserDto = {
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
      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(createUserDto)

      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException)
    })

    it('should throw InternalServerErrorException on Prisma error', async () => {
      const createUserDto: UserRegisterDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      }
      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null)
      jest.spyOn(databaseService.user, 'create').mockRejectedValue(new Error())

      await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('updateUser', () => {
    it('should update user fields successfully', async () => {
      const updateUserDto: UpdateUserDto = { email: 'new@example.com', firstName: 'Jane' }
      const existingUser = {
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
      const updatedUser = { ...existingUser, ...updateUserDto }

      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(existingUser)
      jest.spyOn(databaseService.user, 'update').mockResolvedValue(updatedUser)

      const result = await service.updateUser('044740a9-2f5d-4e97-9afb-dc48f400164a', updateUserDto)
      expect(result).toEqual(updatedUser)
    })

    it('should throw an error if no fields are provided for update', async () => {
      const updateUserDto: UpdateUserDto = {}
      const existingUser = {
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

      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(existingUser)

      await expect(service.updateUser('044740a9-2f5d-4e97-9afb-dc48f400164a', updateUserDto)).rejects.toThrow(
        'No fields to update',
      )
    })
  })
})
