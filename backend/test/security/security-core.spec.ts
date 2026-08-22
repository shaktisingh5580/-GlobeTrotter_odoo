import { HttpStatus, HttpException, ExecutionContext, CallHandler, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';
import { Prisma } from '@prisma/client';

import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from '../../src/common/interceptors/response-transform.interceptor';
import { RequestIdMiddleware } from '../../src/common/middleware/request-id.middleware';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { AppConfigService } from '../../src/config/config.service';

describe('Phase 3 Security Core Test Suite', () => {
  describe('GlobalExceptionFilter (Error Sanitization)', () => {
    let filter: GlobalExceptionFilter;
    let mockResponse: any;
    let mockRequest: any;
    let mockHost: any;

    beforeEach(() => {
      filter = new GlobalExceptionFilter();
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockRequest = {
        method: 'POST',
        url: '/api/v1/trips',
        requestId: 'req_test123456789',
      };
      mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      };
    });

    it('should sanitize Prisma P2002 duplicate key error to 409 Conflict', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        { code: 'P2002', clientVersion: '6.19.3' },
      );

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'CONFLICT',
            message: 'A resource with these unique details already exists.',
            request_id: 'req_test123456789',
          }),
        }),
      );
    });

    it('should sanitize Prisma P2025 record not found to 404 Not Found', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record to update not found.',
        { code: 'P2025', clientVersion: '6.19.3' },
      );

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            request_id: 'req_test123456789',
          }),
        }),
      );
    });

    it('should sanitize unknown error to 500 without leaking stack traces or internal DB schema', () => {
      const internalError = new Error('FATAL: password authentication failed for user "postgres" at host 10.0.0.1');

      filter.catch(internalError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          request_id: 'req_test123456789',
        },
      });
    });

    it('should format class-validator 400 Bad Request into VALIDATION_ERROR format', () => {
      const validationError = new HttpException(
        {
          statusCode: 400,
          message: ['email must be an email', 'password is too short'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(validationError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          request_id: 'req_test123456789',
          details: ['email must be an email', 'password is too short'],
        },
      });
    });
  });

  describe('ResponseTransformInterceptor (Envelope Standard)', () => {
    let interceptor: ResponseTransformInterceptor<any>;
    let mockContext: any;
    let mockRequest: any;

    beforeEach(() => {
      interceptor = new ResponseTransformInterceptor();
      mockRequest = {
        requestId: 'req_test_envelope_99',
      };
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      };
    });

    it('should wrap raw controller data into standard envelope with request_id and timestamp', (done) => {
      const callHandler: CallHandler = {
        handle: () => of({ trip_id: '123', title: 'Paris Getaway' }),
      };

      interceptor.intercept(mockContext, callHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: { trip_id: '123', title: 'Paris Getaway' },
          meta: expect.objectContaining({
            request_id: 'req_test_envelope_99',
            timestamp: expect.any(String),
          }),
        });
        done();
      });
    });

    it('should format paginated results with pagination metadata', (done) => {
      const callHandler: CallHandler = {
        handle: () =>
          of({
            items: [{ id: '1' }, { id: '2' }],
            pagination: { total: 50, limit: 2, offset: 0, has_more: true },
          }),
      };

      interceptor.intercept(mockContext, callHandler).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual([{ id: '1' }, { id: '2' }]);
        expect(result.meta.pagination).toEqual({
          total: 50,
          limit: 2,
          offset: 0,
          has_more: true,
        });
        done();
      });
    });
  });

  describe('RequestIdMiddleware', () => {
    let middleware: RequestIdMiddleware;
    let mockReq: any;
    let mockRes: any;
    let next: jest.Mock;

    beforeEach(() => {
      middleware = new RequestIdMiddleware();
      mockReq = { headers: {} };
      mockRes = { setHeader: jest.fn() };
      next = jest.fn();
    });

    it('should generate a req_ prefixed UUID and set X-Request-ID response header', () => {
      middleware.use(mockReq, mockRes, next);

      expect(mockReq.requestId).toMatch(/^req_[a-f0-9]{16}$/);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.requestId);
      expect(next).toHaveBeenCalled();
    });

    it('should preserve existing incoming X-Request-ID header if provided', () => {
      mockReq.headers['x-request-id'] = 'req_custom_client_123';

      middleware.use(mockReq, mockRes, next);

      expect(mockReq.requestId).toBe('req_custom_client_123');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'req_custom_client_123');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('RolesGuard (RBAC & Endpoint Obfuscation)', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
    });

    it('should allow access if route has no @Roles() requirement', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'USER' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access if user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'ADMIN' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw 404 NotFoundException (instead of 403) when user lacks role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'USER' } }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(NotFoundException);
    });
  });

  describe('JwtAuthGuard (Public Route Bypass)', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;
    let jwtService: JwtService;
    let configService: AppConfigService;

    beforeEach(() => {
      reflector = new Reflector();
      jwtService = { verifyAsync: jest.fn() } as any;
      configService = { jwtSecret: 'test_secret' } as any;
      guard = new JwtAuthGuard(reflector, jwtService, configService);
    });

    it('should allow access if route is decorated with @Public()', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException if no token is provided for non-public route', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const context = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});
