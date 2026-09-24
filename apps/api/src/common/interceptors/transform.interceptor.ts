import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '@leaderos/shared-types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request?.url ?? '';

    return next.handle().pipe(
      map((data: T) => {
        // Nếu response đã có sẵn structure data và meta thì giữ nguyên
        if (
          typeof data === 'object' &&
          data !== null &&
          'data' in (data as Record<string, unknown>) &&
          'meta' in (data as Record<string, unknown>)
        ) {
          return data as unknown as ApiResponse<T>;
        }

        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path,
          },
        };
      }),
    );
  }
}
