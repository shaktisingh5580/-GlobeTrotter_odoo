import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/features/auth/auth.service';
import { HashUtil } from '../../src/common/utils/hash.util';

describe('Phase 5: Auth Module & Security Test Suite', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockAudit: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshSession: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock_jwt_access_token_123'),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockConfig = {
      bcryptRounds: 12,
    };

    service = new AuthService(mockPrisma, mockJwtService, mockAudit, mockConfig);
  });

  describe('User Registration (POST /auth/register)', () => {
    const validRegisterDto = {
      email: 'Shakti.Kumar@Example.COM', // Test case-insensitive email normalization
      password: 'SecureP@ssword123!',
      first_name: 'Shakti',
      last_name: 'Kumar',
      bio: 'Travel enthusiast & globetrotter explorer',
      phone: '+91-9876543210',
      city: 'Mumbai',
      country: 'India',
    };

    it('should successfully register a user, normalize email, hash password with bcrypt, and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }: any) => ({
        id: 'new-user-uuid-1',
        email: data.email,
        password_hash: data.password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio,
        phone: data.phone,
        city: data.city,
        country: data.country,
        language: 'en',
        role: 'USER',
        email_verified: false,
        created_at: new Date('2026-08-22T12:00:00.000Z'),
        deleted_at: null,
      }));

      const response = await service.register(
        validRegisterDto,
        'req_reg_123',
        '192.168.1.1',
        'Mozilla/5.0',
        'http://localhost:3000',
      );

      // Verify email was normalized to lowercase
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'shakti.kumar@example.com' },
      });

      // Verify password was hashed (bcrypt hash format $2b$12$)
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.email).toBe('shakti.kumar@example.com');
      expect(createCall.data.password_hash).not.toBe(validRegisterDto.password);
      expect(createCall.data.password_hash).toMatch(/^\$2[aby]\$\d{2}\$/);

      // Verify returned user object strictly excludes password_hash and deleted_at
      expect(response.user).toEqual({
        id: 'new-user-uuid-1',
        email: 'shakti.kumar@example.com',
        first_name: 'Shakti',
        last_name: 'Kumar',
        bio: 'Travel enthusiast & globetrotter explorer',
        phone: '+91-9876543210',
        city: 'Mumbai',
        country: 'India',
        avatar_url: null,
        language: 'en',
        role: 'USER',
        email_verified: false,
        created_at: expect.any(Date),
      });

      expect(response.access_token).toBe('mock_jwt_access_token_123');
      expect(typeof response.refresh_token).toBe('string');

      // Verify Audit log was recorded
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_CREATED',
          actor_user_id: 'new-user-uuid-1',
          resource_type: 'user',
          request_id: 'req_reg_123',
        }),
      );
    });

    it('should throw 409 ConflictException when email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'shakti.kumar@example.com',
        deleted_at: null,
      });

      await expect(
        service.register(validRegisterDto, 'req_conflict_123'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('User Login (POST /auth/login)', () => {
    it('should authenticate valid credentials and issue tokens', async () => {
      const plainPassword = 'CorrectP@ssword123!';
      const hashedPassword = await HashUtil.hashPassword(plainPassword, 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'shakti@example.com',
        password_hash: hashedPassword,
        first_name: 'Shakti',
        last_name: 'Kumar',
        bio: 'Traveler',
        phone: null,
        city: 'Mumbai',
        country: 'India',
        language: 'en',
        role: 'USER',
        email_verified: true,
        created_at: new Date(),
        deleted_at: null,
      });

      const response = await service.login(
        { email: 'SHAKTI@example.com', password: plainPassword },
        'req_login_123',
        '127.0.0.1',
        'TestAgent',
      );

      expect(response.user.email).toBe('shakti@example.com');
      expect(response.access_token).toBe('mock_jwt_access_token_123');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          actor_user_id: 'user-uuid-1',
          request_id: 'req_login_123',
        }),
      );
    });

    it('should reject non-existent user with generic 401 Unauthorized and log LOGIN_FAILED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login(
          { email: 'nonexistent@example.com', password: 'AnyPassword123!' },
          'req_fail_1',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
          request_id: 'req_fail_1',
          metadata: expect.objectContaining({ reason: 'user_not_found' }),
        }),
      );
    });

    it('should reject wrong password with generic 401 Unauthorized and log LOGIN_FAILED', async () => {
      const realPasswordHash = await HashUtil.hashPassword('CorrectPassword123!', 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'shakti@example.com',
        password_hash: realPasswordHash,
        deleted_at: null,
      });

      await expect(
        service.login(
          { email: 'shakti@example.com', password: 'WrongPassword999!' },
          'req_fail_2',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
          request_id: 'req_fail_2',
          metadata: expect.objectContaining({ reason: 'invalid_password' }),
        }),
      );
    });

    it('should reject soft-deleted accounts with generic 401 Unauthorized', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'deleted-user',
        email: 'deleted@example.com',
        password_hash: 'somehash',
        deleted_at: new Date('2026-08-01T00:00:00.000Z'),
      });

      await expect(
        service.login(
          { email: 'deleted@example.com', password: 'Password123!' },
          'req_deleted_1',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
