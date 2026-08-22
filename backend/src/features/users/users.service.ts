import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AppConfigService } from '../../config/config.service';
import { HashUtil } from '../../common/utils/hash.util';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserProfileResponse, UserStatsResponse } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Retrieves the authenticated user's profile with safe projection (never returning passwords or deleted_at).
   */
  async getProfile(
    user: AuthenticatedUser,
    hostUrl?: string,
  ): Promise<UserProfileResponse> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        avatar_file: true,
      },
    });

    if (!userRecord || userRecord.deleted_at !== null) {
      throw new NotFoundException('User profile not found.');
    }

    return this.toProfileResponse(userRecord, hostUrl);
  }

  /**
   * Updates user profile fields with whitelist protection and avatar ownership validation.
   */
  async updateProfile(
    user: AuthenticatedUser,
    dto: UpdateUserDto,
    requestId: string,
    hostUrl?: string,
  ): Promise<UserProfileResponse> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userRecord || userRecord.deleted_at !== null) {
      throw new NotFoundException('User profile not found.');
    }

    // Verify avatar_file_id ownership if provided
    if (dto.avatar_file_id) {
      const mediaFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.avatar_file_id },
      });

      if (!mediaFile || mediaFile.deleted_at !== null || mediaFile.owner_user_id !== user.id) {
        throw new BadRequestException(
          'Invalid avatar file ID. The file does not exist or does not belong to you.',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        first_name: dto.first_name !== undefined ? dto.first_name : undefined,
        last_name: dto.last_name !== undefined ? dto.last_name : undefined,
        bio: dto.bio !== undefined ? dto.bio : undefined,
        phone: dto.phone !== undefined ? dto.phone : undefined,
        city: dto.city !== undefined ? dto.city : undefined,
        country: dto.country !== undefined ? dto.country : undefined,
        avatar_file_id: dto.avatar_file_id !== undefined ? dto.avatar_file_id : undefined,
        language: dto.language !== undefined ? dto.language : undefined,
      },
      include: {
        avatar_file: true,
      },
    });

    await this.audit.log({
      action: 'USER_UPDATED',
      actor_user_id: user.id,
      resource_type: 'user',
      resource_id: user.id,
      request_id: requestId,
      new_values: dto as any,
    });

    return this.toProfileResponse(updatedUser, hostUrl);
  }

  /**
   * Soft-deletes user account and revokes all refresh sessions.
   */
  async deleteAccount(
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<{ message: string }> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { deleted_at: new Date() },
      }),
      this.prisma.refreshSession.updateMany({
        where: { user_id: user.id, revoked_at: null },
        data: { revoked_at: new Date() },
      }),
    ]);

    await this.audit.log({
      action: 'ACCOUNT_DELETED',
      actor_user_id: user.id,
      resource_type: 'user',
      resource_id: user.id,
      request_id: requestId,
    });

    return { message: 'Account deleted successfully' };
  }

  /**
   * Changes user password, updates hash, and REVOKES all active sessions across devices.
   */
  async changePassword(
    user: AuthenticatedUser,
    dto: ChangePasswordDto,
    requestId: string,
  ): Promise<{ message: string }> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userRecord || userRecord.deleted_at !== null) {
      throw new NotFoundException('User not found.');
    }

    const isCurrentValid = await HashUtil.comparePassword(
      dto.current_password,
      userRecord.password_hash,
    );

    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const newPasswordHash = await HashUtil.hashPassword(
      dto.new_password,
      this.config.bcryptRounds,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password_hash: newPasswordHash },
      }),
      this.prisma.refreshSession.updateMany({
        where: { user_id: user.id, revoked_at: null },
        data: { revoked_at: new Date() },
      }),
    ]);

    await this.audit.log({
      action: 'PASSWORD_CHANGED',
      actor_user_id: user.id,
      resource_type: 'user',
      resource_id: user.id,
      request_id: requestId,
    });

    return { message: 'Password changed. All sessions have been revoked.' };
  }

  /**
   * Computes dynamic user statistics via real database queries (avoiding duplicate stored counters).
   */
  async getUserStats(user: AuthenticatedUser): Promise<UserStatsResponse> {
    const [
      totalTrips,
      completedTrips,
      plannedTrips,
      ongoingTrips,
      savedDestinations,
      communityPosts,
      visitedStops,
      expensesAggregate,
    ] = await Promise.all([
      this.prisma.trip.count({
        where: { user_id: user.id, deleted_at: null },
      }),
      this.prisma.trip.count({
        where: { user_id: user.id, status: 'COMPLETED', deleted_at: null },
      }),
      this.prisma.trip.count({
        where: { user_id: user.id, status: 'PLANNED', deleted_at: null },
      }),
      this.prisma.trip.count({
        where: { user_id: user.id, status: 'ONGOING', deleted_at: null },
      }),
      this.prisma.savedDestination.count({
        where: { user_id: user.id },
      }),
      this.prisma.communityPost.count({
        where: { user_id: user.id, deleted_at: null },
      }),
      this.prisma.tripStop.findMany({
        where: { trip: { user_id: user.id, deleted_at: null } },
        select: { destination_id: true },
        distinct: ['destination_id'],
      }),
      this.prisma.expense.aggregate({
        where: { trip: { user_id: user.id, deleted_at: null } },
        _sum: { amount: true },
      }),
    ]);

    return {
      total_trips: totalTrips,
      completed_trips: completedTrips,
      planned_trips: plannedTrips,
      ongoing_trips: ongoingTrips,
      destinations_visited: visitedStops.length,
      total_expenses: expensesAggregate._sum.amount ? Number(expensesAggregate._sum.amount) : 0,
      saved_destinations: savedDestinations,
      community_posts: communityPosts,
    };
  }

  private toProfileResponse(user: any, hostUrl?: string): UserProfileResponse {
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
      updated_at: user.updated_at,
    };
  }
}
