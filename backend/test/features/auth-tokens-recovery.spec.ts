import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/features/auth/auth.service';
import { HashUtil } from '../../src/common/utils/hash.util';

describe('Phase 6: Auth Tokens & Recovery Security Test Suite', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockAudit: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshSession: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'new-session-id' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      emailVerificationToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('new_jwt_access_token_456'),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockConfig = {
      bcryptRounds: 12,
    };

    service = new AuthService(mockPrisma, mockJwtService, mockAudit, mockConfig);
  });

  describe('Refresh Token Rotation & Family Reuse Detection', () => {
    const rawOldToken = 'valid_raw_refresh_token_abc123';
    const oldTokenHash = HashUtil.sha256(rawOldToken);

    it('should rotate refresh token on valid request', async () => {
      const activeSession = {
        id: 'session-1',
        user_id: 'user-uuid-1',
        token_hash: oldTokenHash,
        family_id: 'family-uuid-100',
        expires_at: new Date(Date.now() + 86400000 * 7),
        revoked_at: null,
        replaced_by: null,
        user: {
          id: 'user-uuid-1',
          email: 'shakti@example.com',
          role: 'USER',
          deleted_at: null,
        },
      };

      mockPrisma.refreshSession.findUnique.mockResolvedValue(activeSession);

      const result = await service.refreshToken(
        { refresh_token: rawOldToken },
        'req_refresh_1',
      );

      expect(result.access_token).toBe('new_jwt_access_token_456');
      expect(typeof result.refresh_token).toBe('string');
      expect(result.refresh_token).not.toBe(rawOldToken);

      // Verify old session was marked revoked and replaced
      expect(mockPrisma.refreshSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          revoked_at: expect.any(Date),
          replaced_by: 'new-session-id',
        }),
      });

      // Verify new session was created with the same family_id
      expect(mockPrisma.refreshSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-uuid-1',
          family_id: 'family-uuid-100',
        }),
      });
    });

    it('CRITICAL SECURITY: should detect token reuse and revoke ENTIRE session family', async () => {
      const compromisedSession = {
        id: 'session-1',
        user_id: 'user-uuid-1',
        token_hash: oldTokenHash,
        family_id: 'family-uuid-100',
        expires_at: new Date(Date.now() + 86400000 * 7),
        revoked_at: new Date('2026-08-20T10:00:00.000Z'), // Already revoked!
        replaced_by: 'session-2',
        user: { id: 'user-uuid-1', email: 'shakti@example.com', deleted_at: null },
      };

      mockPrisma.refreshSession.findUnique.mockResolvedValue(compromisedSession);

      // Attacker attempts to reuse already replaced token
      await expect(
        service.refreshToken({ refresh_token: rawOldToken }, 'req_attack_999'),
      ).rejects.toThrow(UnauthorizedException);

      // Verify ALL tokens in this family were revoked
      expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalledWith({
        where: { family_id: 'family-uuid-100' },
        data: { revoked_at: expect.any(Date) },
      });

      // Verify REFRESH_TOKEN_REUSE audit event was logged
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REFRESH_TOKEN_REUSE',
          actor_user_id: 'user-uuid-1',
          request_id: 'req_attack_999',
        }),
      );
    });

    it('should reject expired refresh tokens', async () => {
      const expiredSession = {
        id: 'session-exp',
        user_id: 'user-uuid-1',
        token_hash: oldTokenHash,
        family_id: 'family-uuid-100',
        expires_at: new Date(Date.now() - 1000), // Expired
        revoked_at: null,
        replaced_by: null,
        user: { id: 'user-uuid-1', email: 'shakti@example.com', deleted_at: null },
      };

      mockPrisma.refreshSession.findUnique.mockResolvedValue(expiredSession);

      await expect(
        service.refreshToken({ refresh_token: rawOldToken }, 'req_exp'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Password Recovery (Forgot & Reset)', () => {
    it('should issue password reset token for valid user and return privacy message', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'shakti@example.com',
        deleted_at: null,
      });

      const response = await service.forgotPassword(
        { email: 'SHAKTI@EXAMPLE.COM' },
        'req_forgot_1',
      );

      expect(response.message).toContain('If an account exists');
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-uuid-1',
          token_hash: expect.any(String),
          expires_at: expect.any(Date),
        }),
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_REQ',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });

    it('should reset password, mark token used, and REVOKE ALL active sessions', async () => {
      const rawResetToken = 'raw_reset_token_secret_xyz';
      const tokenHash = HashUtil.sha256(rawResetToken);

      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'reset-record-1',
        user_id: 'user-uuid-1',
        token_hash: tokenHash,
        is_used: false,
        expires_at: new Date(Date.now() + 3600000), // 1 hour future
      });

      const response = await service.resetPassword(
        { token: rawResetToken, new_password: 'NewStrongPassword123!' },
        'req_reset_done',
      );

      expect(response.message).toContain('Password has been reset');

      // Verify user password updated
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: expect.objectContaining({ password_hash: expect.any(String) }),
      });

      // Verify reset token marked used
      expect(mockPrisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'reset-record-1' },
        data: { is_used: true },
      });

      // Verify all active sessions were revoked (force re-login everywhere)
      expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'user-uuid-1', revoked_at: null },
        data: { revoked_at: expect.any(Date) },
      });

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_DONE',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });

    it('should reject invalid or expired reset token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword(
          { token: 'invalid_token', new_password: 'NewStrongPassword123!' },
          'req_invalid_reset',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Email Verification', () => {
    it('should verify email and mark token used', async () => {
      const rawVerifyToken = 'raw_verify_token_123';
      const tokenHash = HashUtil.sha256(rawVerifyToken);

      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'verify-token-1',
        user_id: 'user-uuid-1',
        token_hash: tokenHash,
        is_used: false,
        expires_at: new Date(Date.now() + 86400000),
      });

      const response = await service.verifyEmail(
        { token: rawVerifyToken },
        'req_verify_email',
      );

      expect(response.message).toContain('Email verified successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: expect.objectContaining({
          email_verified: true,
          email_verified_at: expect.any(Date),
        }),
      });
      expect(mockPrisma.emailVerificationToken.update).toHaveBeenCalledWith({
        where: { id: 'verify-token-1' },
        data: { is_used: true },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMAIL_VERIFIED',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });
  });
});
