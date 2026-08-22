import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role, TripStatus } from '@prisma/client';
import { AdminService } from '../../src/features/admin/admin.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { AppConfigService } from '../../src/config/config.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('AdminService (Phase 15: Admin Dashboard Backend & Analytics)', () => {
  let service: AdminService;
  let prisma: any;
  let audit: any;
  let config: any;

  const mockAdmin: AuthenticatedUser = {
    id: '99999999-9999-9999-9999-999999999999',
    email: 'admin@globetrotter.internal',
    role: Role.ADMIN,
  };

  const sampleUser = {
    id: 'user-100',
    email: 'traveler@example.com',
    first_name: 'Shakti',
    last_name: 'Kumar',
    role: Role.USER,
    city: 'Mumbai',
    country: 'India',
    avatar_file: null,
    email_verified: true,
    created_at: new Date(),
    _count: { trips: 3, community_posts: 1 },
  };

  const sampleTrip = {
    id: 'trip-100',
    title: 'Paris Summer Trip',
    start_date: new Date('2026-09-01'),
    end_date: new Date('2026-09-05'),
    budget_limit: 100000,
    currency: 'INR',
    status: TripStatus.PLANNED,
    user: sampleUser,
    created_at: new Date(),
    _count: { stops: 2 },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      trip: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      destination: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      activity: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      expense: {
        aggregate: jest.fn(),
      },
      sharedTrip: {
        count: jest.fn(),
      },
      communityPost: {
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      analyticsEvent: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      refreshSession: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    config = {
      port: 3000,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: AppConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('getStats', () => {
    it('should aggregate system-wide counts and total expense sum', async () => {
      prisma.user.count.mockResolvedValue(150);
      prisma.trip.count.mockResolvedValue(80);
      prisma.destination.count.mockResolvedValue(16);
      prisma.activity.count.mockResolvedValue(48);
      prisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 2500000 },
      });
      prisma.sharedTrip.count.mockResolvedValue(25);
      prisma.communityPost.count.mockResolvedValue(60);
      prisma.auditLog.count.mockResolvedValue(400);

      const stats = await service.getStats();

      expect(stats.total_users).toBe(150);
      expect(stats.total_trips).toBe(80);
      expect(stats.total_destinations).toBe(16);
      expect(stats.total_activities).toBe(48);
      expect(stats.total_expenses_amount).toBe(2500000);
      expect(stats.active_shares_count).toBe(25);
      expect(stats.total_community_posts).toBe(60);
      expect(stats.total_audit_logs).toBe(400);
    });
  });

  describe('listUsers', () => {
    it('should return paginated user list with counts and metadata', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([sampleUser]);

      const result = await service.listUsers({ limit: 20, offset: 0 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe(sampleUser.email);
      expect(result.items[0].trips_count).toBe(3);
      expect(result.items[0].posts_count).toBe(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('changeUserRole', () => {
    it('should update user role, revoke all refresh sessions, and write audit log', async () => {
      prisma.user.findFirst.mockResolvedValue(sampleUser);
      prisma.user.update.mockResolvedValue({
        ...sampleUser,
        role: Role.ADMIN,
      });
      prisma.refreshSession.updateMany.mockResolvedValue({ count: 2 });

      const updated = await service.changeUserRole(
        sampleUser.id,
        Role.ADMIN,
        mockAdmin,
        'req-admin-role',
      );

      expect(updated.role).toBe(Role.ADMIN);
      expect(prisma.refreshSession.updateMany).toHaveBeenCalledWith({
        where: { user_id: sampleUser.id, revoked_at: null },
        data: { revoked_at: expect.any(Date) },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ROLE_CHANGED',
          actor_user_id: mockAdmin.id,
        }),
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user and revoke all sessions', async () => {
      prisma.user.findFirst.mockResolvedValue(sampleUser);
      prisma.user.update.mockResolvedValue(sampleUser);
      prisma.refreshSession.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteUser(
        sampleUser.id,
        mockAdmin,
        'req-admin-del',
      );

      expect(result.message).toContain('deleted successfully');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: sampleUser.id },
        data: { deleted_at: expect.any(Date) },
      });
    });
  });

  describe('getPopularDestinations', () => {
    it('should return top destinations ordered by real trip_stops count', async () => {
      prisma.destination.findMany.mockResolvedValue([
        {
          id: 'dest-1',
          name: 'Paris',
          country: 'France',
          image_url: null,
          _count: { trip_stops: 142 },
        },
      ]);

      const result = await service.getPopularDestinations();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Paris');
      expect(result[0].trip_stops_count).toBe(142);
    });
  });

  describe('getAnalyticsTrends', () => {
    it('should aggregate analytics telemetry by event type', async () => {
      prisma.analyticsEvent.count.mockResolvedValue(500);
      prisma.analyticsEvent.groupBy.mockResolvedValue([
        { event_type: 'TRIP_CREATED', _count: { id: 120 } },
        { event_type: 'DESTINATION_SEARCHED', _count: { id: 380 } },
      ]);
      prisma.analyticsEvent.findMany.mockResolvedValue([]);

      const result = await service.getAnalyticsTrends();

      expect(result.total_events).toBe(500);
      expect(result.events_by_type).toHaveLength(2);
      expect(result.events_by_type[0].event_type).toBe('TRIP_CREATED');
      expect(result.events_by_type[0].count).toBe(120);
    });
  });

  describe('getAuditLogs', () => {
    it('should return filterable audit log history', async () => {
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          actor_user_id: mockAdmin.id,
          action: 'USER_ROLE_CHANGED',
          resource_type: 'user',
          resource_id: sampleUser.id,
          ip_address: '127.0.0.1',
          request_id: 'req-1',
          old_values: { role: 'USER' },
          new_values: { role: 'ADMIN' },
          created_at: new Date(),
          actor: { email: mockAdmin.email },
        },
      ]);

      const result = await service.getAuditLogs({ limit: 50, offset: 0 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].action).toBe('USER_ROLE_CHANGED');
      expect(result.items[0].actor_email).toBe(mockAdmin.email);
    });
  });
});
