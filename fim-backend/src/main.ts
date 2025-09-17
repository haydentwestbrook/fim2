import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression = require('compression');
import { PrismaService } from './prisma/prisma.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Import AllExceptionsFilter
import { ConfigService } from '@nestjs/config'; // Import ConfigService

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security Middlewares
  app.use(helmet());
  const configService = app.get(ConfigService); // Get ConfigService instance
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const whitelist = frontendUrl ? frontendUrl.split(',') : [];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        logger.log(`CORS check PASSED for origin: ${origin}`);
        callback(null, true);
      } else {
        logger.error(`CORS check FAILED for origin: ${origin}. Whitelist: [${whitelist.join(', ')}]`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter(app.getHttpAdapter())); // Register global exception filter

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('D&D Session Manager API')
    .setDescription('API documentation for the D&D Session Manager application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name is important for referencing it in @ApiBearerAuth()
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
