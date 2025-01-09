import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../../src/modules/app.module'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
describe('AppController (e2e)', () => {
  let app: INestApplication
  let userToken: string

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

    app.enableCors({
      origin: ['http://localhost:3000'],
      credentials: true,
      allowedHeaders: 'Authorization, Content-Type',
    })

    await app.init()
  })

  afterAll(async () => {
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
