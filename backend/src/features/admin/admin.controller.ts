import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminUserQueryDto, ChangeRoleDto } from './dto/admin-user-query.dto';
import { AdminTripQueryDto, AuditLogQueryDto } from './dto/admin-trip-query.dto';
import {
  AdminStatsResponse,
  AdminUserListItem,
  AdminTripListItem,
  PopularDestinationItem,
  PopularActivityItem,
  AnalyticsTrendSummary,
  AuditLogItem,
} from './dto/admin-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats(): Promise<AdminStatsResponse> {
    return this.adminService.getStats();
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  async listUsers(
    @Query() query: AdminUserQueryDto,
  ): Promise<{ items: AdminUserListItem[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:userId/role')
  @HttpCode(HttpStatus.OK)
  async changeUserRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() adminUser: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<AdminUserListItem> {
    return this.adminService.changeUserRole(userId, dto.role, adminUser, requestId);
  }

  @Delete('users/:userId')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() adminUser: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.adminService.deleteUser(userId, adminUser, requestId);
  }

  @Get('users/:userId/trips')
  @HttpCode(HttpStatus.OK)
  async getUserTrips(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminTripListItem[]> {
    return this.adminService.getUserTrips(userId);
  }

  @Get('trips')
  @HttpCode(HttpStatus.OK)
  async listTrips(
    @Query() query: AdminTripQueryDto,
  ): Promise<{ items: AdminTripListItem[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    return this.adminService.listTrips(query);
  }

  @Get('destinations/popular')
  @HttpCode(HttpStatus.OK)
  async getPopularDestinations(): Promise<PopularDestinationItem[]> {
    return this.adminService.getPopularDestinations();
  }

  @Get('activities/popular')
  @HttpCode(HttpStatus.OK)
  async getPopularActivities(): Promise<PopularActivityItem[]> {
    return this.adminService.getPopularActivities();
  }

  @Delete('community/posts/:postId')
  @HttpCode(HttpStatus.OK)
  async deleteCommunityPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() adminUser: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.adminService.deleteCommunityPost(postId, adminUser, requestId);
  }

  @Get('analytics/trends')
  @HttpCode(HttpStatus.OK)
  async getAnalyticsTrends(): Promise<AnalyticsTrendSummary> {
    return this.adminService.getAnalyticsTrends();
  }

  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  async getAuditLogs(
    @Query() query: AuditLogQueryDto,
  ): Promise<{ items: AuditLogItem[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    return this.adminService.getAuditLogs(query);
  }
}
