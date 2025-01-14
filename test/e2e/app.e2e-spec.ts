import { Test, TestingModule } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../../src/modules/app.module'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DatabaseService } from 'modules/database/database.service'
import { User } from 'models/user.model'
import { v4 as uuidv4 } from 'uuid'
import * as bcrypt from 'utils/bcrypt'

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication
  let databaseService: DatabaseService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter())

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )

    databaseService = moduleFixture.get(DatabaseService)

    app.enableCors({
      origin: ['http://localhost:3000'],
      credentials: true,
      allowedHeaders: 'Authorization, Content-Type',
    })

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Auth', () => {
    let token: string
    afterAll(async () => {
      await databaseService.deleteDocuments('users')
    })

    describe('Register', () => {
      it('/auth/register (POST) should register new user', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'new@user.com', firstName: 'New', lastName: 'User', password: 'test123' })
          .expect(201)
      })

      it('/auth/register (POST) should return error because user already exists', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'new@user.com', firstName: 'New', lastName: 'User', password: 'test123' })
          .expect(400)
      })
    })

    describe('Login', () => {
      it('/auth/login (POST) should return access_token', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'new@user.com', password: 'test123' })
          .expect(201)
          .then((res) => {
            token = res.body.access_token
          })
      })

      it('/auth/login (POST) should return error because of wrong password', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'new@user.com', password: 'test111' })
          .expect(400)
      })
    })

    console.log(token)
  })

  describe('User', () => {
    const uniqueUserId = uuidv4()
    let userToken: string
    beforeAll(async () => {
      const password = '123456'
      const hashedPassword = await bcrypt.hash(password)
      const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        email: `${uniqueUserId}@example.com`,
        password: hashedPassword,
        firstName: 'test',
        lastName: 'user',
        avatarUrl: null,
        events: null,
      }
      await databaseService.addDocument('users', newUser)

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `${uniqueUserId}@example.com`, password: password })
        .expect(201)
      userToken = res.body.access_token
    })

    afterAll(async () => {
      await databaseService.deleteDocuments('users')
    })

    describe('Find current user', () => {
      it('/user (GET) should get current user', async () => {
        return request(app.getHttpServer()).get('/user').set('Authorization', `Bearer ${userToken}`).expect(200)
      })

      it('/user (GET) should return error if unauthorized', () => {
        return request(app.getHttpServer()).get('/user').expect(401)
      })
    })

    describe('Update user', () => {
      it('/user/update-user (PATCH) should update current user', async () => {
        return request(app.getHttpServer())
          .patch('/user/update-user')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ firstName: 'Updated' })
          .expect(200)
          .then((res) => {
            expect(res.body.firstName).toBe('Updated')
          })
      })

      it('/user/update-user (PATCH) should return error if unauthorized', () => {
        return request(app.getHttpServer()).patch('/user/update-user').send({ firstName: 'Updated' }).expect(401)
      })
    })

    describe('Update user password', () => {
      it('/user/update-password (PATCH) should update current user', () => {
        return request(app.getHttpServer())
          .patch('/user/update-password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ currentPassword: '123456', newPassword: 'test1234' })
          .expect(200)
      })

      it('/user/update-password (PATCH) should return error if unauthorized', () => {
        return request(app.getHttpServer())
          .patch('/user/update-password')
          .send({ currentPassword: 'test1234', newPassword: 'test123' })
          .expect(401)
      })

      it('/user/update-password (PATCH) should return error if wrong current password', () => {
        return request(app.getHttpServer())
          .patch('/user/update-password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ currentPassword: 'test123', newPassword: 'test1234' })
          .expect(400)
      })
    })
  })
})
