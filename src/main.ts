import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'

const initSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Nextup')
    .setDescription('Nextup API')
    .setVersion('1.0')
    .addTag('Event registration')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
}

const initValidation = (app: INestApplication) =>
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

async function bootstrap() {
  Logger.log(__dirname)
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { bodyParser: false })

  await app.register(fastifyMultipart as any)

  app.register(fastifyStatic as any, {
    root: path.join(__dirname, 'files'),
    prefix: '/files',
  })

  initSwagger(app)
  initValidation(app)

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    allowedHeaders: 'Authorization, Content-Type',
  })

  const PORT = process.env.PORT || 8080
  await app.listen(PORT, '0.0.0.0')

  Logger.log(`App is listening on http://localhost:${PORT}`)
}

bootstrap()
