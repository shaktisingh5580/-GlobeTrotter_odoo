import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role, ActivityCategory } from '@prisma/client';
import { DestinationsService } from '../../src/features/destinations/destinations.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('DestinationsService (Phase 11: Destination Discovery & Bookmarking)', () => {
  let service: DestinationsService;
  let prisma: any;
  let audit: any;

  const mockUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'traveler@example.com',
    role: Role.USER,
  };

  const mockAdmin: AuthenticatedUser = {
    id: '99999999-9999-9999-9999-999999999999',
    email: 'admin@globetrotter.internal',
    role: Role.ADMIN,
  };

  const sampleDestination = {
    id: 'dest-111',
    name: 'Paris',
    country: 'France',
    country_code: 'FR',
    region: 'Western Europe',
    description: 'City of Light',
    image_url: 'https://example.com/paris.jpg',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
    cost_index: 4,
    popularity_score: 98,
    created_at: new Date(),
    updated_at: new Date(),
    _count: { activities: 3 },
    activities: [
      {
        id: 'act-1',
        destination_id: 'dest-111',
        name: 'Eiffel Tower',
        description: 'Iconic tower',
        category: ActivityCategory.SIGHTSEEING,
        estimated_cost: 3000,
        currency: 'INR',
        duration_minutes: 120,
        image_url: null,
        rating: 4.8,
        created_at: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      destination: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      activity: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      savedDestination: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DestinationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<DestinationsService>(DestinationsService);
  });

  describe('listDestinations', () => {
    it('should return catalog destinations with pagination and bookmark status', async () => {
      prisma.destination.count.mockResolvedValue(1);
      prisma.destination.findMany.mockResolvedValue([sampleDestination]);
      prisma.savedDestination.findMany.mockResolvedValue([
        { destination_id: 'dest-111' },
      ]);

      const result = await service.listDestinations(
        { limit: 10, offset: 0, sort: 'popularity_score', order: 'desc' },
        mockUser,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Paris');
      expect(result.items[0].is_saved).toBe(true);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.has_more).toBe(false);
    });

    it('should support unauthenticated public browsing without error', async () => {
      prisma.destination.count.mockResolvedValue(1);
      prisma.destination.findMany.mockResolvedValue([sampleDestination]);

      const result = await service.listDestinations({
        limit: 10,
        offset: 0,
        sort: 'popularity_score',
        order: 'desc',
      });

      expect(result.items[0].is_saved).toBe(false);
    });
  });

  describe('getDestination', () => {
    it('should return full destination detail with activities', async () => {
      prisma.destination.findUnique.mockResolvedValue(sampleDestination);
      prisma.savedDestination.findUnique.mockResolvedValue({ id: 'save-1' });

      const result = await service.getDestination('dest-111', mockUser);

      expect(result.id).toBe('dest-111');
      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].name).toBe('Eiffel Tower');
      expect(result.is_saved).toBe(true);
    });

    it('should throw NotFoundException when destination does not exist', async () => {
      prisma.destination.findUnique.mockResolvedValue(null);

      await expect(service.getDestination('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDestination', () => {
    it('should create destination and record audit event', async () => {
      prisma.destination.create.mockResolvedValue(sampleDestination);

      const result = await service.createDestination(
        {
          name: 'Paris',
          country: 'France',
          country_code: 'FR',
        },
        mockAdmin,
        'req-admin-1',
      );

      expect(result.name).toBe('Paris');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DESTINATION_CREATED',
          actor_user_id: mockAdmin.id,
          resource_type: 'destination',
        }),
      );
    });
  });

  describe('createActivity', () => {
    it('should create activity for existing destination and log audit', async () => {
      prisma.destination.findUnique.mockResolvedValue(sampleDestination);
      prisma.activity.create.mockResolvedValue(sampleDestination.activities[0]);

      const result = await service.createActivity(
        'dest-111',
        {
          name: 'Eiffel Tower',
          category: ActivityCategory.SIGHTSEEING,
          estimated_cost: 3000,
          duration_minutes: 120,
        },
        mockAdmin,
        'req-admin-2',
      );

      expect(result.name).toBe('Eiffel Tower');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ACTIVITY_CREATED',
        }),
      );
    });
  });

  describe('saveDestination & unsaveDestination', () => {
    it('should save bookmark idempotently for user', async () => {
      prisma.destination.findUnique.mockResolvedValue(sampleDestination);
      prisma.savedDestination.upsert.mockResolvedValue({ id: 'saved-1' });

      const res = await service.saveDestination('dest-111', mockUser, 'Must visit!');
      expect(res.message).toContain('saved');
      expect(prisma.savedDestination.upsert).toHaveBeenCalled();
    });

    it('should remove bookmark for user', async () => {
      prisma.savedDestination.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.removeSavedDestination('dest-111', mockUser);
      expect(res.message).toContain('removed');
      expect(prisma.savedDestination.deleteMany).toHaveBeenCalledWith({
        where: {
          user_id: mockUser.id,
          destination_id: 'dest-111',
        },
      });
    });
  });
});
