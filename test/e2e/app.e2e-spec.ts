import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { DatabaseService } from '../../src/modules/database/database.service'
import { AppModule } from '../../src/modules/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication
  let databaseService: DatabaseService
  let userToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    databaseService = moduleFixture.get(DatabaseService)
    await app.init()
  })

  afterAll(async () => {
    await databaseService.user.deleteMany()
    await app.close()
  })

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

  it('/auth/login (POST) should return access_token', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'new@user.com', password: 'test123' })
      .expect(201)
      .then((res) => {
        userToken = res.body.access_token
      })
  })

  it('/auth/login (POST) should return error because of wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'new@user.com', password: 'test111' })
      .expect(400)
  })

  console.log(userToken)
  // it('Example how to include jwt in request', () => {
  //   return request(app.getHttpServer())
  //     .post('/something')
  //     .set('authorization', `Bearer ${userToken}`)
  //     .expect(200)
  //     .expect({ someData: true });
  // });
})
