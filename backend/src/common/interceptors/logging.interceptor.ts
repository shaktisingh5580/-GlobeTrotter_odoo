import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const requestId = request.requestId || 'req_unknown';
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip || request.socket.remoteAddress || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const user = (request as any).user;
          const userIdentifier = user?.id ? `[user:${user.id}]` : '[anonymous]';
          this.logger.log(
            `[${requestId}] ${method} ${url} ${userIdentifier} ${ip} +${duration}ms`,
          );
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `[${requestId}] ${method} ${url} FAIL +${duration}ms - ${err.message || 'Error'}`,
          );
        },
      }),
    );
  }
}
