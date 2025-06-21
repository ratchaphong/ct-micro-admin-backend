import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS here
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Cart Service')
    .setDescription('API for managing cart')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672',
      ],
      queue: configService.get<string>('QUEUE_NAME') ?? 'cart_queue',
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();
  await app.listen(configService.get('PORT') ?? 3003);
}
bootstrap();
