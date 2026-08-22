import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserProfileResponse, UserStatsResponse } from './dto/user-profile.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<UserProfileResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.usersService.getProfile(user, hostUrl);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
    @RequestId() requestId: string,
    @Req() req: Request,
  ): Promise<UserProfileResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.usersService.updateProfile(user, dto, requestId, hostUrl);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.usersService.deleteAccount(user, requestId);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(user, dto, requestId);
  }

  @Get('me/stats')
  @HttpCode(HttpStatus.OK)
  async getUserStats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserStatsResponse> {
    return this.usersService.getUserStats(user);
  }
}
