import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TripsService } from '../../src/features/trips/trips.service';

describe('Phase 8: Trips Module & IDOR Security Test Suite', () => {
  let service: TripsService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockAnalytics: any;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'shakti@example.com',
    role: 'USER',
  };

  beforeEach(() => {
    mockPrisma = {
      trip: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      mediaFile: {
        findUnique: jest.fn(),
      },
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockAnalytics = {
      track: jest.fn().mockResolvedValue(undefined),
    };

    service = new TripsService(mockPrisma, mockAudit, mockAnalytics);
  });

  describe('Create Trip (POST /trips)', () => {
    it('should create a trip with server-derived user ownership', async () => {
      mockPrisma.trip.create.mockResolvedValue({
        id: 'trip-uuid-1',
        user_id: 'user-uuid-1',
        title: 'European Adventure 2026',
        description: '2-week trip',
        start_date: new Date('2026-09-01T00:00:00.000Z'),
        end_date: new Date('2026-09-15T00:00:00.000Z'),
        budget_limit: 200000,
        currency: 'INR',
        cover_file: null,
        status: 'PLANNED',
        created_at: new Date('2026-08-22T10:00:00.000Z'),
      });

      const result = await service.createTrip(
        mockUser,
        {
          title: 'European Adventure 2026',
          description: '2-week trip',
          start_date: '2026-09-01',
          end_date: '2026-09-15',
          budget_limit: 200000,
          currency: 'INR',
          status: 'PLANNED',
        },
        'req_trip_create',
      );

      expect(result.id).toBe('trip-uuid-1');
      expect(result.title).toBe('European Adventure 2026');
      expect(result.start_date).toBe('2026-09-01');
      expect(result.end_date).toBe('2026-09-15');

      // Verify user_id was set from JWT
      expect(mockPrisma.trip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-uuid-1',
          title: 'European Adventure 2026',
        }),
        include: { cover_file: true },
      });

      // Verify audit & telemetry
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TRIP_CREATED',
          actor_user_id: 'user-uuid-1',
        }),
      );
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'TRIP_CREATED',
          user_id: 'user-uuid-1',
        }),
      );
    });

    it('should reject when end_date is before start_date', async () => {
      await expect(
        service.createTrip(
          mockUser,
          {
            title: 'Invalid Dates Trip',
            start_date: '2026-09-15',
            end_date: '2026-09-01', // Before start_date
          },
          'req_fail',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.trip.create).not.toHaveBeenCalled();
    });

    it('should reject cover_file_id not owned by authenticated user', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue({
        id: 'file-other',
        owner_user_id: 'other-user-uuid', // Not user-uuid-1
        deleted_at: null,
      });

      await expect(
        service.createTrip(
          mockUser,
          {
            title: 'Stolen Cover Trip',
            start_date: '2026-09-01',
            end_date: '2026-09-15',
            cover_file_id: 'file-other',
          },
          'req_fail',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('IDOR Protection on Trip Operations', () => {
    it('CRITICAL IDOR DEFENSE: getTrip should return 404 for another user’s trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-belonging-to-alice',
        user_id: 'alice-uuid', // Not user-uuid-1
        deleted_at: null,
      });

      await expect(service.getTrip(mockUser, 'trip-belonging-to-alice')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('CRITICAL IDOR DEFENSE: updateTrip should return 404 for another user’s trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-belonging-to-alice',
        user_id: 'alice-uuid',
        deleted_at: null,
      });

      await expect(
        service.updateTrip(
          mockUser,
          'trip-belonging-to-alice',
          { title: 'Hacked Title' },
          'req_attack',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.trip.update).not.toHaveBeenCalled();
    });

    it('CRITICAL IDOR DEFENSE: deleteTrip should return 404 for another user’s trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-belonging-to-alice',
        user_id: 'alice-uuid',
        deleted_at: null,
      });

      await expect(
        service.deleteTrip(mockUser, 'trip-belonging-to-alice', 'req_attack'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.trip.update).not.toHaveBeenCalled();
    });

    it('should successfully soft-delete own trip and log TRIP_DELETED', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-uuid-1',
        user_id: 'user-uuid-1',
        deleted_at: null,
      });

      const response = await service.deleteTrip(
        mockUser,
        'trip-uuid-1',
        'req_delete',
      );

      expect(response.message).toContain('Trip deleted successfully');
      expect(mockPrisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-uuid-1' },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TRIP_DELETED',
          actor_user_id: 'user-uuid-1',
          resource_id: 'trip-uuid-1',
        }),
      );
    });
  });

  describe('Full Trip View & Dynamic Budget Calculation (GET /trips/:tripId/full)', () => {
    it('should aggregate sections actual_spent and overall budget summary accurately', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-uuid-1',
        user_id: 'user-uuid-1',
        title: 'Europe Trip 2026',
        description: 'Paris & Rome',
        start_date: new Date('2026-09-01T00:00:00.000Z'),
        end_date: new Date('2026-09-10T00:00:00.000Z'),
        budget_limit: 100000,
        currency: 'INR',
        cover_file: null,
        status: 'PLANNED',
        deleted_at: null,
        created_at: new Date('2026-08-22T00:00:00.000Z'),
        updated_at: new Date('2026-08-22T00:00:00.000Z'),
        stops: [
          {
            id: 'stop-1',
            stop_order: 1,
            arrival_date: new Date('2026-09-01T00:00:00.000Z'),
            departure_date: new Date('2026-09-05T00:00:00.000Z'),
            notes: 'Paris leg',
            destination: {
              id: 'dest-1',
              name: 'Paris',
              country: 'France',
              country_code: 'FR',
              image_url: 'http://example.com/paris.jpg',
            },
            itinerary_items: [
              {
                id: 'item-1',
                item_date: new Date('2026-09-02T00:00:00.000Z'),
                start_time: '10:00',
                end_time: '12:00',
                item_order: 1,
                custom_title: 'Eiffel Tower Visit',
                custom_description: 'Pre-booked tickets',
                notes: null,
                activity: {
                  id: 'act-1',
                  name: 'Eiffel Tower Tour',
                  category: 'ATTRACTION',
                  estimated_cost: 3000,
                },
                trip_section: null,
              },
            ],
          },
        ],
        sections: [
          {
            id: 'section-1',
            title: 'Paris Leg Budget',
            description: 'Hotels and food',
            section_type: 'ACCOMMODATION',
            start_date: new Date('2026-09-01T00:00:00.000Z'),
            end_date: new Date('2026-09-05T00:00:00.000Z'),
            planned_budget: 40000,
            currency: 'INR',
            section_order: 1,
            trip_stop: {
              id: 'stop-1',
              destination: { name: 'Paris' },
            },
          },
        ],
        expenses: [
          {
            id: 'exp-1',
            trip_section_id: 'section-1',
            amount: 25000,
          },
          {
            id: 'exp-2',
            trip_section_id: null,
            amount: 5000,
          },
        ],
      });

      const fullTrip = await service.getFullTrip(mockUser, 'trip-uuid-1');

      expect(fullTrip.id).toBe('trip-uuid-1');
      expect(fullTrip.stops.length).toBe(1);
      expect(fullTrip.stops[0].destination.name).toBe('Paris');
      expect(fullTrip.stops[0].itinerary_items.length).toBe(1);

      // Verify per-section calculated actual_spent
      expect(fullTrip.sections[0].actual_spent).toBe(25000);
      expect(fullTrip.sections[0].planned_budget).toBe(40000);

      // Verify overall trip budget summary
      expect(fullTrip.budget_summary).toEqual({
        total_budget: 100000,
        total_spent: 30000, // 25000 + 5000
        remaining: 70000,   // 100000 - 30000
      });
    });
  });
});
