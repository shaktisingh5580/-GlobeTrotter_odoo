import {
  Module,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './features/health/health.module';
import { UploadsModule } from './features/uploads/uploads.module';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { TripsModule } from './features/trips/trips.module';

import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RlsContextMiddleware } from './common/middleware/rls-context.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuditModule,
    AnalyticsModule,
    HealthModule,
    UploadsModule,
    AuthModule,
    UsersModule,
    TripsModule,
    JwtModule.registerAsync({
      global: true,
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtAccessExpiry,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        {
          ttl: config.throttleTtl,
          limit: config.throttleLimit,
        },
      ],
    }),
  ],
  controllers: [],
  providers: [
    // 1. Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 2. Global Authentication Guard (enforces JWT by default; @Public() skips)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 3. Global RBAC Authorization Guard (@Roles())
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 4. Global Exception Sanitization Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // 5. Global Structured Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 6. Global Response Envelope Transform Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RlsContextMiddleware)
      .forRoutes('*');
  }
}
