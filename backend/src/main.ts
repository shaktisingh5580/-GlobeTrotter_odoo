import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(AppConfigService);

  // Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow local asset serving
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Body Size Limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // Serve static uploaded assets safely
  const uploadsPath = path.join(process.cwd(), configService.uploadDir);
  app.use('/uploads', express.static(uploadsPath));

  // CORS Configuration
  app.enableCors({
    origin: configService.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  });

  // Global Prefix for API endpoints
  app.setGlobalPrefix(configService.apiPrefix);

  // Global Validation Pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = configService.port;
  await app.listen(port);
  logger.log(`🚀 GlobeTrotter Backend API running on port ${port} in [${configService.nodeEnv}] mode`);
  logger.log(`🔗 API Base URL: http://localhost:${port}/${configService.apiPrefix}`);
  logger.log(`📁 Static Uploads: http://localhost:${port}/uploads`);
}

bootstrap();
