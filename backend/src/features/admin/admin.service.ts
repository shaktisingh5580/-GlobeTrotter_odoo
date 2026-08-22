import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Role, TripStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AppConfigService } from '../../config/config.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Aggregates global platform statistics.
   */
  async getStats(): Promise<AdminStatsResponse> {
    const [
      totalUsers,
      totalTrips,
      totalDestinations,
      totalActivities,
      expenseAgg,
      activeShares,
      totalPosts,
      totalAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deleted_at: null } }),
      this.prisma.trip.count({ where: { deleted_at: null } }),
      this.prisma.destination.count(),
      this.prisma.activity.count(),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.sharedTrip.count({ where: { is_active: true } }),
      this.prisma.communityPost.count({ where: { deleted_at: null } }),
      this.prisma.auditLog.count(),
    ]);

    return {
      total_users: totalUsers,
      total_trips: totalTrips,
      total_destinations: totalDestinations,
      total_activities: totalActivities,
      total_expenses_amount: Number(expenseAgg._sum.amount || 0),
      active_shares_count: activeShares,
      total_community_posts: totalPosts,
      total_audit_logs: totalAuditLogs,
    };
  }

  /**
   * Lists users with search, role filters, and pagination.
   */
  async listUsers(
    query: AdminUserQueryDto,
  ): Promise<{ items: AdminUserListItem[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    const where: any = { deleted_at: null };

    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { first_name: { contains: query.q, mode: 'insensitive' } },
        { last_name: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { created_at: 'desc' },
        include: {
          avatar_file: true,
          _count: {
            select: { trips: true, community_posts: true },
          },
        },
      }),
    ]);

    const items: AdminUserListItem[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      city: u.city,
      country: u.country,
      avatar_url: u.avatar_file
        ? `http://localhost:${this.config.port}/uploads/${u.avatar_file.storage_key}`
        : null,
      trips_count: u._count.trips,
      posts_count: u._count.community_posts,
      email_verified: u.email_verified,
      created_at: u.created_at,
    }));

    return {
      items,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        has_more: query.offset + query.limit < total,
      },
    };
  }

  /**
   * Promotes or demotes user role and revokes their active sessions.
   */
  async changeUserRole(
    userId: string,
    role: Role,
    adminUser: AuthenticatedUser,
    requestId: string,
  ): Promise<AdminUserListItem> {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      include: {
        avatar_file: true,
        _count: { select: { trips: true, community_posts: true } },
      },
    });

    // Revoke all refresh sessions for this user immediately
    await this.prisma.refreshSession.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    await this.audit.log({
      action: 'USER_ROLE_CHANGED',
      actor_user_id: adminUser.id,
      resource_type: 'user',
      resource_id: userId,
      request_id: requestId,
      old_values: { role: existing.role },
      new_values: { role: updated.role },
    });

    return {
      id: updated.id,
      email: updated.email,
      first_name: updated.first_name,
      last_name: updated.last_name,
      role: updated.role,
      city: updated.city,
      country: updated.country,
      avatar_url: updated.avatar_file
        ? `http://localhost:${this.config.port}/uploads/${updated.avatar_file.storage_key}`
        : null,
      trips_count: updated._count.trips,
      posts_count: updated._count.community_posts,
      email_verified: updated.email_verified,
      created_at: updated.created_at,
    };
  }

  /**
   * Soft deletes a user and revokes all refresh sessions.
   */
  async deleteUser(
    userId: string,
    adminUser: AuthenticatedUser,
    requestId: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { deleted_at: new Date() },
      });

      await tx.refreshSession.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    });

    await this.audit.log({
      action: 'USER_DELETED_BY_ADMIN',
      actor_user_id: adminUser.id,
      resource_type: 'user',
      resource_id: userId,
      request_id: requestId,
    });

    return { message: 'User deleted successfully.' };
  }

  /**
   * Views all trips for a specific user.
   */
  async getUserTrips(userId: string): Promise<AdminTripListItem[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const trips = await this.prisma.trip.findMany({
      where: { user_id: userId, deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        user: true,
        _count: { select: { stops: true } },
      },
    });

    return trips.map((t) => this.toTripListItem(t));
  }

  /**
   * Lists all trips in the system with search and status filtering.
   */
  async listTrips(
    query: AdminTripQueryDto,
  ): Promise<{ items: AdminTripListItem[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    const where: any = { deleted_at: null };

    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [total, trips] = await Promise.all([
      this.prisma.trip.count({ where }),
      this.prisma.trip.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { created_at: 'desc' },
        include: {
          user: true,
          _count: { select: { stops: true } },
        },
      }),
    ]);

    const items = trips.map((t) => this.toTripListItem(t));

    return {
      items,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        has_more: query.offset + query.limit < total,
      },
    };
  }

  /**
   * Calculates top destinations from REAL trip_stops occurrences.
   */
  async getPopularDestinations(): Promise<PopularDestinationItem[]> {
    const destinations = await this.prisma.destination.findMany({
      include: {
        _count: {
          select: { trip_stops: true },
        },
      },
      orderBy: {
        trip_stops: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return destinations.map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      trip_stops_count: d._count.trip_stops,
      image_url: d.image_url,
    }));
  }

  /**
   * Calculates top activities from REAL itinerary_items occurrences.
   */
  async getPopularActivities(): Promise<PopularActivityItem[]> {
    const activities = await this.prisma.activity.findMany({
      include: {
        destination: true,
        _count: {
          select: { itinerary_items: true },
        },
      },
      orderBy: {
        itinerary_items: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return activities.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      destination_name: a.destination.name,
      scheduled_count: a._count.itinerary_items,
    }));
  }

  /**
   * Deletes a community post as an admin moderator.
   */
  async deleteCommunityPost(
    postId: string,
    adminUser: AuthenticatedUser,
    requestId: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.communityPost.findFirst({
      where: { id: postId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Community post not found.');
    }

    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      action: 'POST_DELETED_BY_ADMIN',
      actor_user_id: adminUser.id,
      resource_type: 'community_post',
      resource_id: postId,
      request_id: requestId,
    });

    return { message: 'Community post deleted by admin.' };
  }

  /**
   * Aggregates telemetry data from analytics_events table.
   */
  async getAnalyticsTrends(): Promise<AnalyticsTrendSummary> {
    const [totalEvents, eventsByType, recentActivity] = await Promise.all([
      this.prisma.analyticsEvent.count(),
      this.prisma.analyticsEvent.groupBy({
        by: ['event_type'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.analyticsEvent.findMany({
        take: 20,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      total_events: totalEvents,
      events_by_type: eventsByType.map((e) => ({
        event_type: e.event_type,
        count: e._count.id,
      })),
      recent_activity: recentActivity.map((r) => ({
        id: r.id,
        event_type: r.event_type,
        entity_type: r.entity_type,
        user_id: r.user_id,
        created_at: r.created_at,
      })),
    };
  }

  /**
   * Inspects security audit trail with filtering.
   */
  async getAuditLogs(
    query: AuditLogQueryDto,
  ): Promise<{ items: AuditLogItem[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    const where: any = {};

    if (query.action) where.action = query.action;
    if (query.resource_type) where.resource_type = query.resource_type;
    if (query.actor_user_id) where.actor_user_id = query.actor_user_id;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { created_at: 'desc' },
        include: {
          actor: { select: { email: true } },
        },
      }),
    ]);

    const items: AuditLogItem[] = logs.map((l) => ({
      id: l.id,
      actor_user_id: l.actor_user_id,
      actor_email: l.actor?.email || null,
      action: l.action,
      resource_type: l.resource_type,
      resource_id: l.resource_id,
      ip_address: l.ip_address,
      request_id: l.request_id,
      old_values: l.old_values,
      new_values: l.new_values,
      created_at: l.created_at,
    }));

    return {
      items,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        has_more: query.offset + query.limit < total,
      },
    };
  }

  private toTripListItem(t: any): AdminTripListItem {
    return {
      id: t.id,
      title: t.title,
      start_date: t.start_date.toISOString().slice(0, 10),
      end_date: t.end_date.toISOString().slice(0, 10),
      budget_limit: t.budget_limit ? Number(t.budget_limit) : null,
      currency: t.currency,
      status: t.status,
      user: {
        id: t.user.id,
        email: t.user.email,
        first_name: t.user.first_name,
        last_name: t.user.last_name,
      },
      stops_count: t._count.stops,
      created_at: t.created_at,
    };
  }
}
