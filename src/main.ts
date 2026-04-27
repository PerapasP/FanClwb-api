import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Enable Socket.IO WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Fanclwb API')
    .setDescription('The Fanclwb API documentation for tax management system')
    .setVersion('1.0.0')
    .addTag('Health', 'Health check endpoints')
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Profile', 'User profile management endpoints')
    .addTag('Live Streams', 'Live streaming session management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3002);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3002}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3002}/api`,
  );
}
void bootstrap();
