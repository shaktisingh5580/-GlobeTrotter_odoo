import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role, TripStatus, SectionType } from '@prisma/client';
import { SharingService } from '../../src/features/sharing/sharing.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { AppConfigService } from '../../src/config/config.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('SharingService (Phase 14: Sharing Module)', () => {
  let service: SharingService;
  let prisma: any;
  let audit: any;
  let config: any;

  const mockUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'traveler@example.com',
    role: Role.USER,
  };

  const sampleTrip = {
    id: 'trip-100',
    user_id: mockUser.id,
    title: 'Paris Summer 2026',
    description: 'Scenic exploration',
    start_date: new Date('2026-09-01'),
    end_date: new Date('2026-09-05'),
    budget_limit: 150000,
    currency: 'INR',
    status: TripStatus.PLANNED,
    deleted_at: null,
    stops: [
      {
        id: 'stop-1',
        destination_id: 'dest-1',
        stop_order: 0,
        arrival_date: new Date('2026-09-01'),
        departure_date: new Date('2026-09-05'),
        notes: null,
        destination: {
          name: 'Paris',
          country: 'France',
          image_url: 'https://example.com/paris.jpg',
        },
        sections: [
          {
            id: 'sec-1',
            title: 'Louvre Tour',
            section_type: SectionType.ACTIVITY,
            start_date: new Date('2026-09-02'),
            end_date: new Date('2026-09-02'),
          },
        ],
        itinerary_items: [],
      },
    ],
    sections: [],
  };

  const sampleShare = {
    id: 'share-1',
    trip_id: sampleTrip.id,
    share_token: 'a1b2c3d4e5f60718',
    visibility: 'LINK_ONLY',
    is_active: true,
    expires_at: null,
    created_at: new Date(),
    trip: sampleTrip,
  };

  beforeEach(async () => {
    prisma = {
      trip: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      tripStop: {
        create: jest.fn(),
      },
      tripSection: {
        create: jest.fn(),
      },
      itineraryItem: {
        create: jest.fn(),
      },
      sharedTrip: {
        findUnique: jest.fn(),
        create: jest.fn(),
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
        SharingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: AppConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  describe('createShare', () => {
    it('should generate a 16-character token and return a share url', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.sharedTrip.updateMany.mockResolvedValue({ count: 1 });
      prisma.sharedTrip.create.mockResolvedValue(sampleShare);

      const result = await service.createShare(
        sampleTrip.id,
        { expires_in_days: 30 },
        mockUser,
        'req-share-1',
      );

      expect(result.share_token).toBe('a1b2c3d4e5f60718');
      expect(result.share_url).toContain('/shared/a1b2c3d4e5f60718');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SHARE_CREATED',
          actor_user_id: mockUser.id,
        }),
      );
    });
  });

  describe('getSharedTrip', () => {
    it('should return sanitized public view without exposing user PII or budget', async () => {
      prisma.sharedTrip.findUnique.mockResolvedValue(sampleShare);

      const result = await service.getSharedTrip('a1b2c3d4e5f60718');

      expect(result.title).toBe(sampleTrip.title);
      expect(result.stops).toHaveLength(1);
      expect(result.stops[0].destination.name).toBe('Paris');

      // Verify ZERO PII or budget leakage
      expect((result as any).user_id).toBeUndefined();
      expect((result as any).user).toBeUndefined();
      expect((result as any).budget_limit).toBeUndefined();
      expect((result as any).expenses).toBeUndefined();
    });

    it('should throw NotFoundException (404) for expired or deactivated share link', async () => {
      prisma.sharedTrip.findUnique.mockResolvedValue({
        ...sampleShare,
        is_active: false,
      });

      await expect(service.getSharedTrip('inactive-token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('copySharedTrip', () => {
    it('should deep copy trip into user account in a transaction and set copied_from', async () => {
      prisma.sharedTrip.findUnique.mockResolvedValue(sampleShare);
      prisma.trip.create.mockResolvedValue({
        ...sampleTrip,
        id: 'new-trip-200',
        title: 'Copy of Paris Summer 2026',
        user_id: mockUser.id,
        copied_from_trip_id: sampleTrip.id,
      });
      prisma.tripStop.create.mockResolvedValue({ id: 'new-stop-1' });

      const result = await service.copySharedTrip(
        'a1b2c3d4e5f60718',
        mockUser,
        'req-copy',
      );

      expect(result.trip_id).toBe('new-trip-200');
      expect(result.copied_from).toBe(sampleTrip.id);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TRIP_COPIED',
          actor_user_id: mockUser.id,
        }),
      );
    });
  });

  describe('revokeShare', () => {
    it('should deactivate share token for trip owner', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.sharedTrip.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.revokeShare(
        sampleTrip.id,
        mockUser,
        'req-revoke',
      );

      expect(result.message).toContain('revoked successfully');
      expect(prisma.sharedTrip.updateMany).toHaveBeenCalledWith({
        where: { trip_id: sampleTrip.id, is_active: true },
        data: { is_active: false },
      });
    });
  });
});
