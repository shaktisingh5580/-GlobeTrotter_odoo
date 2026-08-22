import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthResponse, AuthTokens } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 / hour / IP
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @RequestId() requestId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.authService.register(dto, requestId, ipAddress, userAgent, hostUrl);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 900000 } }) // 10 / 15 min / IP
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @RequestId() requestId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.authService.login(dto, requestId, ipAddress, userAgent, hostUrl);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 / min / IP
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @RequestId() requestId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthTokens> {
    return this.authService.refreshToken(dto, requestId, ipAddress, userAgent);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() dto: Partial<RefreshTokenDto>,
    @CurrentUser() user: AuthenticatedUser | null,
    @RequestId() requestId: string,
    @Ip() ipAddress: string,
  ): Promise<{ message: string }> {
    return this.authService.logout(dto.refresh_token, user?.id, requestId, ipAddress);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 / hour
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @RequestId() requestId: string,
    @Ip() ipAddress: string,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto, requestId, ipAddress);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 / hour / IP
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @RequestId() requestId: string,
    @Ip() ipAddress: string,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto, requestId, ipAddress);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 / hour / IP
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto, requestId);
  }

  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  async sendVerificationEmail(
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.authService.sendVerificationEmail(user.id, requestId);
  }
}
