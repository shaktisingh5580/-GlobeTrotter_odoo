import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiErrorResponse } from '../types/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = request.requestId || 'req_unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'An unexpected error occurred. Please try again later.';
    let errorDetails: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          // Class-validator returns an array of string error messages
          errorMessage = 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
          errorDetails = resObj.message;
        } else {
          errorMessage = resObj.message || exception.message;
        }
      }

      errorCode = errorCode === 'VALIDATION_ERROR' ? errorCode : this.mapHttpStatusToCode(status);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.mapPrismaError(exception);
      status = mapped.status;
      errorCode = mapped.code;
      errorMessage = mapped.message;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'BAD_REQUEST';
      errorMessage = 'Invalid database query or data payload format.';
    } else if (exception instanceof Error) {
      errorMessage = 'Internal server error';
      errorCode = 'INTERNAL_ERROR';
    }

    // Comprehensive server-side logging with request ID (never exposed to client)
    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} -> ${status} [${errorCode}]: ${errorMessage}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        request_id: requestId,
        ...(errorDetails ? { details: errorDetails } : {}),
      },
    };

    response.status(status).json(errorPayload);
  }

  private mapHttpStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'PAYLOAD_TOO_LARGE';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      default:
        return 'INTERNAL_ERROR';
    }
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    code: string;
    message: string;
  } {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'A resource with these unique details already exists.',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'BAD_REQUEST',
          message: 'Invalid foreign key reference provided.',
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'BAD_REQUEST',
          message: 'Relation violation occurred.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'INTERNAL_ERROR',
          message: 'A database error occurred.',
        };
    }
  }
}
