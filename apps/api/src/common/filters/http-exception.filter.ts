import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '@leaderos/shared-types';
import { resolveLanguage, translateErrorMessage, HTTP_ERROR_TRANSLATIONS } from '../i18n/backend-i18n';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;
        if ('message' in resObj) {
          if (typeof resObj['message'] === 'string' || Array.isArray(resObj['message'])) {
            message = resObj['message'] as string | string[];
          }
        }
        if ('error' in resObj && typeof resObj['error'] === 'string') {
          error = resObj['error'];
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    // Resolve language from Accept-Language header
    const acceptLanguage = request.headers['accept-language'] as string | undefined;
    const lang = resolveLanguage(acceptLanguage);

    const translatedMessage = translateErrorMessage(message, statusCode, lang);
    const translatedError = HTTP_ERROR_TRANSLATIONS[statusCode]?.[lang] ?? error;

    const errorResponse: ApiErrorResponse = {
      statusCode,
      message: translatedMessage,
      error: translatedError,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }
}
