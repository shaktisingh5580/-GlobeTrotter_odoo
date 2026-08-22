import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SectionType } from '@prisma/client';
import { SectionsService } from '../../src/features/sections/sections.service';

describe('Phase 10: Trip Sections Module & Two-Level IDOR Security Test Suite', () => {
  let service: SectionsService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'shakti@example.com',
    role: 'USER',
  };

  const validParentTrip = {
    id: 'trip-uuid-1',
    user_id: 'user-uuid-1',
    title: 'Europe 2026',
    start_date: new Date('2026-09-01T00:00:00.000Z'),
    end_date: new Date('2026-09-15T00:00:00.000Z'),
    currency: 'INR',
    deleted_at: null,
  };

  beforeEach(() => {
    mockPrisma = {
      trip: {
        findUnique: jest.fn(),
      },
      tripStop: {
        findUnique: jest.fn(),
      },
      tripSection: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      itineraryItem: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new SectionsService(mockPrisma, mockAudit);
  });

  describe('Create Section (POST /trips/:tripId/sections)', () => {
    it('should create section with trip bounds validation and sequential ordering', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(validParentTrip);
      mockPrisma.tripSection.findFirst.mockResolvedValue(null);
      mockPrisma.tripSection.create.mockResolvedValue({
        id: 'section-uuid-1',
        trip_id: 'trip-uuid-1',
        trip_stop_id: null,
        title: 'Paris Accommodation',
        description: 'Boutique hotel in Marais',
        section_type: SectionType.STAY,
        start_date: new Date('2026-09-01T00:00:00.000Z'),
        end_date: new Date('2026-09-05T00:00:00.000Z'),
        planned_budget: 45000,
        currency: 'INR',
        section_order: 1,
        created_at: new Date('2026-08-22T00:00:00.000Z'),
        updated_at: new Date('2026-08-22T00:00:00.000Z'),
        deleted_at: null,
        trip_stop: null,
        expenses: [],
      });

      const section = await service.createSection(
        mockUser,
        'trip-uuid-1',
        {
          title: 'Paris Accommodation',
          description: 'Boutique hotel in Marais',
          section_type: SectionType.STAY,
          start_date: '2026-09-01',
          end_date: '2026-09-05',
          planned_budget: 45000,
          currency: 'INR',
        },
        'req_sec_create',
      );

      expect(section.id).toBe('section-uuid-1');
      expect(section.section_order).toBe(1);
      expect(section.planned_budget).toBe(45000);
      expect(section.actual_spent).toBe(0);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECTION_CREATED',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });

    it('should reject section dates outside parent trip dates', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(validParentTrip);

      await expect(
        service.createSection(
          mockUser,
          'trip-uuid-1',
          {
            title: 'Invalid Dates Section',
            start_date: '2026-08-20', // BEFORE trip start
            end_date: '2026-09-05',
          },
          'req_fail',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject trip_stop_id that belongs to a different trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(validParentTrip);
      mockPrisma.tripStop.findUnique.mockResolvedValue({
        id: 'stop-other-trip',
        trip_id: 'DIFFERENT-TRIP', // Mismatch!
      });

      await expect(
        service.createSection(
          mockUser,
          'trip-uuid-1',
          {
            title: 'Cross Trip Linked Stop',
            start_date: '2026-09-01',
            end_date: '2026-09-05',
            trip_stop_id: 'stop-other-trip',
          },
          'req_fail',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('TWO-LEVEL IDOR: should reject section creation on another user’s trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-alice',
        user_id: 'alice-uuid', // Not user-uuid-1
        deleted_at: null,
      });

      await expect(
        service.createSection(
          mockUser,
          'trip-alice',
          {
            title: 'Hacked Section',
            start_date: '2026-09-01',
            end_date: '2026-09-05',
          },
          'req_attack',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Update Section (PATCH /trips/:tripId/sections/:sectionId)', () => {
    it('TWO-LEVEL IDOR: should reject update if section belongs to another user', async () => {
      mockPrisma.tripSection.findUnique.mockResolvedValue({
        id: 'section-1',
        trip_id: 'trip-uuid-1',
        deleted_at: null,
        trip: { user_id: 'alice-uuid', deleted_at: null }, // Not user-uuid-1
      });

      await expect(
        service.updateSection(
          mockUser,
          'trip-uuid-1',
          'section-1',
          { title: 'Hacked Title' },
          'req_attack',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Delete Section (DELETE /trips/:tripId/sections/:sectionId)', () => {
    it('should soft-delete section, unlink itinerary items, and re-normalize ordering', async () => {
      mockPrisma.tripSection.findUnique.mockResolvedValue({
        id: 'section-1',
        trip_id: 'trip-uuid-1',
        deleted_at: null,
        trip: { user_id: 'user-uuid-1', deleted_at: null },
      });
      mockPrisma.tripSection.findMany.mockResolvedValue([
        { id: 'section-2', section_order: 2 }, // Re-normalizes to 1
      ]);

      const response = await service.deleteSection(
        mockUser,
        'trip-uuid-1',
        'section-1',
        'req_del_sec',
      );

      expect(response.message).toContain('deleted successfully');
      expect(mockPrisma.tripSection.update).toHaveBeenCalledWith({
        where: { id: 'section-1' },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      });
      expect(mockPrisma.itineraryItem.updateMany).toHaveBeenCalledWith({
        where: { trip_section_id: 'section-1' },
        data: { trip_section_id: null },
      });
      expect(mockPrisma.tripSection.update).toHaveBeenCalledWith({
        where: { id: 'section-2' },
        data: { section_order: 1 },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECTION_DELETED',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });
  });

  describe('Reorder Sections (PUT /trips/:tripId/sections/reorder)', () => {
    it('should reorder sections atomically and log SECTIONS_REORDERED', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-uuid-1',
        user_id: 'user-uuid-1',
        deleted_at: null,
        sections: [{ id: 's1' }, { id: 's2' }],
      });

      mockPrisma.tripSection.findMany.mockResolvedValue([
        {
          id: 's2',
          trip_id: 'trip-uuid-1',
          trip_stop_id: null,
          title: 'Rome Tours',
          description: null,
          section_type: SectionType.ACTIVITY,
          start_date: new Date('2026-09-06T00:00:00.000Z'),
          end_date: new Date('2026-09-10T00:00:00.000Z'),
          planned_budget: 20000,
          currency: 'INR',
          section_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
          trip_stop: null,
          expenses: [{ amount: 15000 }],
        },
        {
          id: 's1',
          trip_id: 'trip-uuid-1',
          trip_stop_id: null,
          title: 'Paris Hotel',
          description: null,
          section_type: SectionType.STAY,
          start_date: new Date('2026-09-01T00:00:00.000Z'),
          end_date: new Date('2026-09-05T00:00:00.000Z'),
          planned_budget: 40000,
          currency: 'INR',
          section_order: 2,
          created_at: new Date(),
          updated_at: new Date(),
          trip_stop: null,
          expenses: [],
        },
      ]);

      const result = await service.reorderSections(
        mockUser,
        'trip-uuid-1',
        { section_ids: ['s2', 's1'] },
        'req_reorder_sec',
      );

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('s2');
      expect(result[0].section_order).toBe(1);
      expect(result[0].actual_spent).toBe(15000);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECTIONS_REORDERED',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });
  });
});
