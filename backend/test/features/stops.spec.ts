import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StopsService } from '../../src/features/stops/stops.service';

describe('Phase 9: Trip Stops Module & Two-Level IDOR Security Test Suite', () => {
  let service: StopsService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockAnalytics: any;

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
    deleted_at: null,
  };

  beforeEach(() => {
    mockPrisma = {
      trip: {
        findUnique: jest.fn(),
      },
      destination: {
        findUnique: jest.fn(),
      },
      tripStop: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockAnalytics = {
      track: jest.fn().mockResolvedValue(undefined),
    };

    service = new StopsService(mockPrisma, mockAudit, mockAnalytics);
  });

  describe('Create Stop (POST /trips/:tripId/stops)', () => {
    it('should create stop with automatic sequential ordering and trip bounds validation', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(validParentTrip);
      mockPrisma.destination.findUnique.mockResolvedValue({
        id: 'dest-paris-1',
        name: 'Paris',
        country: 'France',
        country_code: 'FR',
      });
      mockPrisma.tripStop.findFirst.mockResolvedValue(null); // No existing stops, order will be 1
      mockPrisma.tripStop.create.mockResolvedValue({
        id: 'stop-uuid-1',
        trip_id: 'trip-uuid-1',
        destination_id: 'dest-paris-1',
        arrival_date: new Date('2026-09-01T00:00:00.000Z'),
        departure_date: new Date('2026-09-05T00:00:00.000Z'),
        notes: 'Paris leg',
        stop_order: 1,
        created_at: new Date('2026-08-22T00:00:00.000Z'),
        updated_at: new Date('2026-08-22T00:00:00.000Z'),
        destination: {
          id: 'dest-paris-1',
          name: 'Paris',
          country: 'France',
          country_code: 'FR',
          image_url: null,
          latitude: null,
          longitude: null,
        },
      });

      const stop = await service.createStop(
        mockUser,
        'trip-uuid-1',
        {
          destination_id: 'dest-paris-1',
          arrival_date: '2026-09-01',
          departure_date: '2026-09-05',
          notes: 'Paris leg',
        },
        'req_stop_create',
      );

      expect(stop.id).toBe('stop-uuid-1');
      expect(stop.stop_order).toBe(1);
      expect(stop.destination.name).toBe('Paris');

      // Verify audit & telemetry
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOP_CREATED',
          actor_user_id: 'user-uuid-1',
        }),
      );
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'STOP_ADDED',
          user_id: 'user-uuid-1',
        }),
      );
    });

    it('should reject stop dates outside parent trip dates', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(validParentTrip); // 2026-09-01 to 2026-09-15
      mockPrisma.destination.findUnique.mockResolvedValue({ id: 'dest-paris-1', name: 'Paris' });

      // Arrival before trip start
      await expect(
        service.createStop(
          mockUser,
          'trip-uuid-1',
          {
            destination_id: 'dest-paris-1',
            arrival_date: '2026-08-25', // BEFORE trip start!
            departure_date: '2026-09-05',
          },
          'req_fail_bounds',
        ),
      ).rejects.toThrow(BadRequestException);

      // Departure after trip end
      await expect(
        service.createStop(
          mockUser,
          'trip-uuid-1',
          {
            destination_id: 'dest-paris-1',
            arrival_date: '2026-09-10',
            departure_date: '2026-09-20', // AFTER trip end!
          },
          'req_fail_bounds_2',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('TWO-LEVEL IDOR: should reject stop creation on another user’s trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-other-user',
        user_id: 'alice-uuid', // Not user-uuid-1
        deleted_at: null,
      });

      await expect(
        service.createStop(
          mockUser,
          'trip-other-user',
          {
            destination_id: 'dest-1',
            arrival_date: '2026-09-01',
            departure_date: '2026-09-05',
          },
          'req_attack',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Update Stop (PATCH /trips/:tripId/stops/:stopId)', () => {
    it('TWO-LEVEL IDOR: should reject update if stop does not belong to specified trip', async () => {
      mockPrisma.tripStop.findUnique.mockResolvedValue({
        id: 'stop-1',
        trip_id: 'DIFFERENT-TRIP-UUID', // Mismatch with tripId parameter!
        trip: { user_id: 'user-uuid-1', deleted_at: null },
      });

      await expect(
        service.updateStop(
          mockUser,
          'trip-uuid-1',
          'stop-1',
          { notes: 'Hacked notes' },
          'req_idor_attack',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('TWO-LEVEL IDOR: should reject update if trip belongs to another user', async () => {
      mockPrisma.tripStop.findUnique.mockResolvedValue({
        id: 'stop-1',
        trip_id: 'trip-uuid-1',
        trip: { user_id: 'alice-uuid', deleted_at: null }, // Not user-uuid-1
      });

      await expect(
        service.updateStop(
          mockUser,
          'trip-uuid-1',
          'stop-1',
          { notes: 'Hacked notes' },
          'req_idor_attack_2',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Delete Stop (DELETE /trips/:tripId/stops/:stopId)', () => {
    it('should delete stop and re-normalize remaining stops ordering', async () => {
      mockPrisma.tripStop.findUnique.mockResolvedValue({
        id: 'stop-1',
        trip_id: 'trip-uuid-1',
        trip: { user_id: 'user-uuid-1', deleted_at: null },
      });
      mockPrisma.tripStop.findMany.mockResolvedValue([
        { id: 'stop-2', stop_order: 2 }, // Needs to be re-normalized to 1
      ]);

      const response = await service.deleteStop(
        mockUser,
        'trip-uuid-1',
        'stop-1',
        'req_del_stop',
      );

      expect(response.message).toContain('deleted successfully');
      expect(mockPrisma.tripStop.delete).toHaveBeenCalledWith({
        where: { id: 'stop-1' },
      });
      expect(mockPrisma.tripStop.update).toHaveBeenCalledWith({
        where: { id: 'stop-2' },
        data: { stop_order: 1 },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOP_DELETED',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });
  });

  describe('Reorder Stops (PUT /trips/:tripId/stops/reorder)', () => {
    it('should reorder stops atomically and log STOPS_REORDERED', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-uuid-1',
        user_id: 'user-uuid-1',
        deleted_at: null,
        stops: [{ id: 'stop-1' }, { id: 'stop-2' }],
      });

      mockPrisma.tripStop.findMany.mockResolvedValue([
        {
          id: 'stop-2',
          trip_id: 'trip-uuid-1',
          destination_id: 'd2',
          stop_order: 1,
          arrival_date: new Date('2026-09-06T00:00:00.000Z'),
          departure_date: new Date('2026-09-10T00:00:00.000Z'),
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          destination: { id: 'd2', name: 'Rome', country: 'Italy', country_code: 'IT' },
        },
        {
          id: 'stop-1',
          trip_id: 'trip-uuid-1',
          destination_id: 'd1',
          stop_order: 2,
          arrival_date: new Date('2026-09-01T00:00:00.000Z'),
          departure_date: new Date('2026-09-05T00:00:00.000Z'),
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          destination: { id: 'd1', name: 'Paris', country: 'France', country_code: 'FR' },
        },
      ]);

      const result = await service.reorderStops(
        mockUser,
        'trip-uuid-1',
        { stop_ids: ['stop-2', 'stop-1'] },
        'req_reorder',
      );

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('stop-2');
      expect(result[0].stop_order).toBe(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOPS_REORDERED',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });

    it('should reject invalid stop_ids length or non-member IDs', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-uuid-1',
        user_id: 'user-uuid-1',
        deleted_at: null,
        stops: [{ id: 'stop-1' }, { id: 'stop-2' }],
      });

      // Missing stop-2
      await expect(
        service.reorderStops(
          mockUser,
          'trip-uuid-1',
          { stop_ids: ['stop-1'] },
          'req_fail_reorder',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
