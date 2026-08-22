import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Role, ActivityCategory, SectionType } from '@prisma/client';
import { ItineraryService } from '../../src/features/itinerary/itinerary.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('ItineraryService (Phase 12: Daily Activity Schedule, Calendar & Timeline)', () => {
  let service: ItineraryService;
  let prisma: any;
  let audit: any;

  const mockUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'traveler@example.com',
    role: Role.USER,
  };

  const sampleTrip = {
    id: 'trip-100',
    user_id: mockUser.id,
    title: 'Paris Summer Holiday',
    start_date: new Date('2026-09-01'),
    end_date: new Date('2026-09-05'),
    deleted_at: null,
  };

  const sampleStop = {
    id: 'stop-200',
    trip_id: sampleTrip.id,
    destination_id: 'dest-300',
    arrival_date: new Date('2026-09-01'),
    departure_date: new Date('2026-09-05'),
    destination: {
      id: 'dest-300',
      name: 'Paris',
      country: 'France',
    },
  };

  const sampleSection = {
    id: 'sec-400',
    trip_id: sampleTrip.id,
    title: 'Sightseeing',
    section_type: SectionType.ACTIVITY,
    deleted_at: null,
  };

  const sampleItem = {
    id: 'item-500',
    trip_stop_id: sampleStop.id,
    trip_section_id: sampleSection.id,
    activity_id: 'act-600',
    item_date: new Date('2026-09-02'),
    start_time: '09:30',
    end_time: '12:30',
    item_order: 0,
    custom_title: null,
    custom_description: null,
    notes: 'Pre-booked slot',
    activity: {
      id: 'act-600',
      name: 'Louvre Tour',
      description: 'Art exploration',
      category: ActivityCategory.CULTURE,
      estimated_cost: 2500,
      currency: 'INR',
      duration_minutes: 180,
      rating: 4.9,
    },
    trip_section: {
      id: sampleSection.id,
      title: sampleSection.title,
      section_type: sampleSection.section_type,
    },
    expenses: [
      {
        id: 'exp-700',
        title: 'Louvre Ticket',
        amount: 2500,
        currency: 'INR',
        category: 'ACTIVITIES',
      },
    ],
    trip_stop: sampleStop,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      trip: {
        findFirst: jest.fn(),
      },
      tripStop: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      tripSection: {
        findFirst: jest.fn(),
      },
      activity: {
        findUnique: jest.fn(),
      },
      itineraryItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      expense: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ItineraryService>(ItineraryService);
  });

  describe('getTripItinerary', () => {
    it('should return grouped itinerary days for authenticated trip owner', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.itineraryItem.findMany.mockResolvedValue([sampleItem]);

      const result = await service.getTripItinerary(sampleTrip.id, mockUser);

      expect(result.trip_id).toBe(sampleTrip.id);
      expect(result.days).toHaveLength(1);
      expect(result.days[0].date).toBe('2026-09-02');
      expect(result.days[0].stop?.destination_name).toBe('Paris');
      expect(result.days[0].items).toHaveLength(1);
      expect(result.days[0].items[0].activity?.name).toBe('Louvre Tour');
    });

    it('should throw NotFoundException (404) if trip belongs to someone else (IDOR protection)', async () => {
      prisma.trip.findFirst.mockResolvedValue(null);

      await expect(
        service.getTripItinerary('other-user-trip', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getItineraryItem', () => {
    it('should return a single itinerary item by ID', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.itineraryItem.findFirst.mockResolvedValue(sampleItem);

      const result = await service.getItineraryItem(
        sampleTrip.id,
        sampleItem.id,
        mockUser,
      );

      expect(result.id).toBe(sampleItem.id);
      expect(result.custom_title).toBeNull();
      expect(result.activity?.name).toBe('Louvre Tour');
    });

    it('should throw NotFoundException (404) when item is not found', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.itineraryItem.findFirst.mockResolvedValue(null);

      await expect(
        service.getItineraryItem(sampleTrip.id, 'non-existent-item', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createItineraryItem', () => {
    it('should create an itinerary item when dates and ownership are valid', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.tripStop.findFirst.mockResolvedValue(sampleStop);
      prisma.tripSection.findFirst.mockResolvedValue(sampleSection);
      prisma.activity.findUnique.mockResolvedValue(sampleItem.activity);
      prisma.itineraryItem.findFirst.mockResolvedValue(null);
      prisma.itineraryItem.create.mockResolvedValue(sampleItem);

      const result = await service.createItineraryItem(
        sampleTrip.id,
        {
          trip_stop_id: sampleStop.id,
          trip_section_id: sampleSection.id,
          activity_id: sampleItem.activity.id,
          item_date: '2026-09-02',
          start_time: '09:30',
          end_time: '12:30',
          item_order: 0,
        },
        mockUser,
        'req-1',
      );

      expect(result.id).toBe(sampleItem.id);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ITEM_CREATED',
          actor_user_id: mockUser.id,
        }),
      );
    });

    it('should reject when item_date is outside the stop arrival-departure range', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.tripStop.findFirst.mockResolvedValue(sampleStop);

      await expect(
        service.createItineraryItem(
          sampleTrip.id,
          {
            trip_stop_id: sampleStop.id,
            item_date: '2026-09-10', // Outside Sep 01-05
            item_order: 0,
            custom_title: 'Late stroll',
          },
          mockUser,
          'req-2',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when end_time is before or equal to start_time', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.tripStop.findFirst.mockResolvedValue(sampleStop);

      await expect(
        service.createItineraryItem(
          sampleTrip.id,
          {
            trip_stop_id: sampleStop.id,
            item_date: '2026-09-02',
            start_time: '14:00',
            end_time: '11:00',
            item_order: 0,
            custom_title: 'Time travel walk',
          },
          mockUser,
          'req-3',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when trip_stop belongs to a different trip (Cross-Parent IDOR)', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.tripStop.findFirst.mockResolvedValue(null);

      await expect(
        service.createItineraryItem(
          sampleTrip.id,
          {
            trip_stop_id: 'foreign-stop-id',
            item_date: '2026-09-02',
            item_order: 0,
            custom_title: 'Unlinked visit',
          },
          mockUser,
          'req-4',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject duplicate item_order on the same date for the same stop', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.tripStop.findFirst.mockResolvedValue(sampleStop);
      prisma.itineraryItem.findFirst.mockResolvedValue(sampleItem);

      await expect(
        service.createItineraryItem(
          sampleTrip.id,
          {
            trip_stop_id: sampleStop.id,
            item_date: '2026-09-02',
            item_order: 0,
            custom_title: 'Conflicting slot',
          },
          mockUser,
          'req-5',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteItineraryItem', () => {
    it('should unlink expenses and delete itinerary item atomically', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.itineraryItem.findFirst.mockResolvedValue(sampleItem);
      prisma.expense.updateMany.mockResolvedValue({ count: 1 });
      prisma.itineraryItem.delete.mockResolvedValue(sampleItem);

      const result = await service.deleteItineraryItem(
        sampleTrip.id,
        sampleItem.id,
        mockUser,
        'req-del',
      );

      expect(result.message).toContain('deleted successfully');
      expect(prisma.expense.updateMany).toHaveBeenCalledWith({
        where: { itinerary_item_id: sampleItem.id },
        data: { itinerary_item_id: null },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ITEM_DELETED' }),
      );
    });
  });

  describe('getItineraryCalendar', () => {
    it('should build complete date intervals with items and expenses aggregated', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.itineraryItem.findMany.mockResolvedValue([sampleItem]);
      prisma.expense.findMany.mockResolvedValue([
        {
          id: 'exp-1',
          trip_id: sampleTrip.id,
          expense_date: new Date('2026-09-02'),
          amount: 2500,
        },
      ]);
      prisma.tripStop.findMany.mockResolvedValue([sampleStop]);

      const result = await service.getItineraryCalendar(sampleTrip.id, mockUser);

      expect(result.trip_id).toBe(sampleTrip.id);
      expect(result.calendar.length).toBeGreaterThan(0);
      const day2 = result.calendar.find((d) => d.date === '2026-09-02');
      expect(day2).toBeDefined();
      expect(day2?.items_count).toBe(1);
      expect(day2?.total_expense).toBe(2500);
      expect(day2?.stop).toBe('Paris');
    });
  });

  describe('getItineraryTimeline', () => {
    it('should return chronological list of timeline items', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.itineraryItem.findMany.mockResolvedValue([sampleItem]);

      const result = await service.getItineraryTimeline(sampleTrip.id, mockUser);

      expect(result.trip_id).toBe(sampleTrip.id);
      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].title).toBe('Louvre Tour');
      expect(result.timeline[0].stop_name).toBe('Paris');
      expect(result.timeline[0].estimated_cost).toBe(2500);
    });
  });
});
