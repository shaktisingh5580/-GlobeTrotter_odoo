import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService<EnvironmentVariables, true>) {}

  get nodeEnv(): string {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get apiPrefix(): string {
    return this.configService.get('API_PREFIX', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get jwtSecret(): string {
    return this.configService.get('JWT_SECRET', { infer: true });
  }

  get jwtAccessExpiry(): string {
    return this.configService.get('JWT_ACCESS_EXPIRY', { infer: true });
  }

  get jwtRefreshExpiry(): string {
    return this.configService.get('JWT_REFRESH_EXPIRY', { infer: true });
  }

  get bcryptRounds(): number {
    return this.configService.get('BCRYPT_ROUNDS', { infer: true });
  }

  get allowedOrigins(): string[] {
    const raw = this.configService.get('ALLOWED_ORIGINS', { infer: true });
    return raw ? raw.split(',').map((o) => o.trim()) : ['http://localhost:5173'];
  }

  get throttleTtl(): number {
    return this.configService.get('THROTTLE_TTL', { infer: true });
  }

  get throttleLimit(): number {
    return this.configService.get('THROTTLE_LIMIT', { infer: true });
  }

  get uploadDir(): string {
    return this.configService.get('UPLOAD_DIR', { infer: true });
  }

  get maxFileSize(): number {
    return this.configService.get('MAX_FILE_SIZE', { infer: true });
  }
}
