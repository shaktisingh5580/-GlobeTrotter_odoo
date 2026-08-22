import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AppConfigService } from '../../config/config.service';
import { HashUtil } from '../../common/utils/hash.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthResponse, AuthTokens, SafeUser } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Registers a new user account, creates default refresh session, and logs audit event.
   */
  async register(
    dto: RegisterDto,
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
    hostUrl?: string,
  ): Promise<AuthResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.deleted_at === null) {
      throw new ConflictException('An account with this email address already exists.');
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await HashUtil.hashPassword(
      dto.password,
      this.config.bcryptRounds,
    );

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password_hash: passwordHash,
        first_name: dto.first_name.trim(),
        last_name: dto.last_name.trim(),
        bio: dto.bio?.trim() || null,
        phone: dto.phone?.trim() || null,
        city: dto.city?.trim() || null,
        country: dto.country?.trim() || null,
      },
      include: {
        avatar_file: true,
      },
    });

    // Generate JWT access token & refresh token session
    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    // Audit log
    await this.audit.log({
      action: 'USER_CREATED',
      actor_user_id: user.id,
      resource_type: 'user',
      resource_id: user.id,
      request_id: requestId,
      ip_address: ipAddress,
      user_agent: userAgent,
      new_values: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });

    return {
      user: this.toSafeUser(user, hostUrl),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  /**
   * Validates user credentials with generic error messaging (preventing account enumeration).
   */
  async login(
    dto: LoginDto,
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
    hostUrl?: string,
  ): Promise<AuthResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        avatar_file: true,
      },
    });

    // Check existence & soft-deletion
    if (!user || user.deleted_at !== null) {
      await this.audit.log({
        action: 'LOGIN_FAILED',
        resource_type: 'auth',
        request_id: requestId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { email: normalizedEmail, reason: 'user_not_found' },
      });
      // Generic error message to prevent account enumeration
      throw new UnauthorizedException('Invalid email address or password.');
    }

    // Verify password hash
    const isPasswordValid = await HashUtil.comparePassword(
      dto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      await this.audit.log({
        action: 'LOGIN_FAILED',
        actor_user_id: user.id,
        resource_type: 'auth',
        request_id: requestId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { email: normalizedEmail, reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Invalid email address or password.');
    }

    // Issue new tokens & refresh session family
    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    await this.audit.log({
      action: 'LOGIN_SUCCESS',
      actor_user_id: user.id,
      resource_type: 'auth',
      resource_id: user.id,
      request_id: requestId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return {
      user: this.toSafeUser(user, hostUrl),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  /**
   * Refreshes access and refresh tokens with family-based reuse detection.
   */
  async refreshToken(
    dto: RefreshTokenDto,
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const tokenHash = HashUtil.sha256(dto.refresh_token);

    const session = await this.prisma.refreshSession.findUnique({
      where: { token_hash: tokenHash },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // REUSE DETECTION: If token was already revoked or replaced, revoke entire family
    if (session.revoked_at !== null || session.replaced_by !== null) {
      await this.prisma.refreshSession.updateMany({
        where: { family_id: session.family_id },
        data: { revoked_at: new Date() },
      });

      await this.audit.log({
        action: 'REFRESH_TOKEN_REUSE',
        actor_user_id: session.user_id,
        resource_type: 'auth',
        request_id: requestId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          family_id: session.family_id,
          attempted_token_hash: tokenHash,
        },
      });

      throw new UnauthorizedException(
        'Token reuse detected. All active sessions have been terminated. Please log in again.',
      );
    }

    // Expiry check
    if (session.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    // User active check
    if (!session.user || session.user.deleted_at !== null) {
      throw new UnauthorizedException('User account is invalid or no longer active.');
    }

    // Generate new Access Token and new Refresh Token B
    const newRawRefreshToken = HashUtil.generateRandomToken(32);
    const newTokenHash = HashUtil.sha256(newRawRefreshToken);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Create new session in same family & mark old session replaced
    const newSession = await this.prisma.refreshSession.create({
      data: {
        user_id: session.user_id,
        token_hash: newTokenHash,
        family_id: session.family_id,
        ip_address: ipAddress || null,
        device_info: userAgent || null,
        expires_at: newExpiresAt,
      },
    });

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        revoked_at: new Date(),
        replaced_by: newSession.id,
      },
    });

    const payload = {
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      first_name: session.user.first_name,
      last_name: session.user.last_name,
    };

    const newAccessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: newAccessToken,
      refresh_token: newRawRefreshToken,
    };
  }

  /**
   * Logs out user by revoking the refresh token session.
   */
  async logout(
    refreshToken?: string,
    userId?: string,
    requestId?: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    if (refreshToken) {
      const tokenHash = HashUtil.sha256(refreshToken);
      await this.prisma.refreshSession.updateMany({
        where: { token_hash: tokenHash },
        data: { revoked_at: new Date() },
      });
    }

    if (userId) {
      await this.audit.log({
        action: 'LOGOUT',
        actor_user_id: userId,
        resource_type: 'auth',
        request_id: requestId,
        ip_address: ipAddress,
      });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Initiates password reset by issuing a hashed token. Uniform response prevents email enumeration.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
    requestId: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.deleted_at === null) {
      const rawToken = HashUtil.generateRandomToken(32);
      const tokenHash = HashUtil.sha256(rawToken);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      // Invalidate previous unused reset tokens
      await this.prisma.passwordResetToken.updateMany({
        where: { user_id: user.id, is_used: false },
        data: { is_used: true },
      });

      await this.prisma.passwordResetToken.create({
        data: {
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        },
      });

      await this.audit.log({
        action: 'PASSWORD_RESET_REQ',
        actor_user_id: user.id,
        resource_type: 'auth',
        request_id: requestId,
        ip_address: ipAddress,
      });

      // In production, send email with rawToken. For local development, log securely:
      this.logger.log(`[Dev Only] Password reset token generated for ${user.email}: ${rawToken}`);
    }

    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  }

  /**
   * Resets user password, marks token used, and REVOKES all active sessions for security.
   */
  async resetPassword(
    dto: ResetPasswordDto,
    requestId: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const tokenHash = HashUtil.sha256(dto.token);

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!resetRecord || resetRecord.is_used || resetRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const newPasswordHash = await HashUtil.hashPassword(
      dto.new_password,
      this.config.bcryptRounds,
    );

    // Update user password, mark reset token used, and revoke all active refresh sessions
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.user_id },
        data: { password_hash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { is_used: true },
      }),
      this.prisma.refreshSession.updateMany({
        where: { user_id: resetRecord.user_id, revoked_at: null },
        data: { revoked_at: new Date() },
      }),
    ]);

    await this.audit.log({
      action: 'PASSWORD_RESET_DONE',
      actor_user_id: resetRecord.user_id,
      resource_type: 'auth',
      request_id: requestId,
      ip_address: ipAddress,
    });

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  /**
   * Verifies user email via confirmation token.
   */
  async verifyEmail(
    dto: VerifyEmailDto,
    requestId: string,
  ): Promise<{ message: string }> {
    const tokenHash = HashUtil.sha256(dto.token);

    const verifyRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!verifyRecord || verifyRecord.is_used || verifyRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired email verification token.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verifyRecord.user_id },
        data: { email_verified: true, email_verified_at: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verifyRecord.id },
        data: { is_used: true },
      }),
    ]);

    await this.audit.log({
      action: 'EMAIL_VERIFIED',
      actor_user_id: verifyRecord.user_id,
      resource_type: 'auth',
      request_id: requestId,
    });

    return { message: 'Email verified successfully.' };
  }

  /**
   * Generates a new email verification token.
   */
  async sendVerificationEmail(
    userId: string,
    requestId: string,
  ): Promise<{ message: string }> {
    const rawToken = HashUtil.generateRandomToken(32);
    const tokenHash = HashUtil.sha256(rawToken);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await this.prisma.emailVerificationToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    this.logger.log(`[Dev Only] Email verification token for user ${userId}: ${rawToken}`);

    return { message: 'Email verification link has been sent.' };
  }

  /**
   * Generates JWT Access Token and persistent Refresh Token Session.
   */
  private async generateTokens(
    user: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Generate random raw refresh token
    const rawRefreshToken = HashUtil.generateRandomToken(32);
    const tokenHash = HashUtil.sha256(rawRefreshToken);
    const familyId = uuidv4();

    // 7 days expiration for refresh tokens
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save refresh session in database
    await this.prisma.refreshSession.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        family_id: familyId,
        ip_address: ipAddress || null,
        device_info: userAgent || null,
        expires_at: expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
    };
  }

  /**
   * Strictly projects user entity to safe response shape (excludes passwords, tokens, deleted_at).
   */
  toSafeUser(user: any, hostUrl?: string): SafeUser {
    let avatarUrl = null;
    if (user.avatar_file && user.avatar_file.storage_key) {
      avatarUrl = hostUrl
        ? `${hostUrl}/uploads/${user.avatar_file.storage_key}`
        : `/uploads/${user.avatar_file.storage_key}`;
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio ?? null,
      phone: user.phone ?? null,
      city: user.city ?? null,
      country: user.country ?? null,
      avatar_url: avatarUrl,
      language: user.language || 'en',
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at,
    };
  }
}
