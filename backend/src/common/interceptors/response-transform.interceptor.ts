import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse, ApiResponseMeta } from '../types/api-response.interface';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.requestId || 'req_unknown';

    return next.handle().pipe(
      map((data) => {
        // If data is already in standard ApiResponse format or null/empty string
        if (data && typeof data === 'object' && 'success' in data && data.success === true) {
          if (!data.meta) {
            data.meta = {
              request_id: requestId,
              timestamp: new Date().toISOString(),
            };
          }
          return data;
        }

        // Check if data is a paginated result containing { items: [...], pagination: {...} }
        let responseData = data;
        let paginationMeta = undefined;

        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'pagination' in data
        ) {
          responseData = data.items;
          paginationMeta = data.pagination;
        } else if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data &&
          'pagination' in data.meta
        ) {
          responseData = data.data;
          paginationMeta = data.meta.pagination;
        }

        const meta: ApiResponseMeta = {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          ...(paginationMeta ? { pagination: paginationMeta } : {}),
        };

        return {
          success: true,
          data: responseData !== undefined ? responseData : null,
          meta,
        };
      }),
    );
  }
}
