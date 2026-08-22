import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { ReorderStopsDto } from './dto/reorder-stops.dto';
import { StopResponse } from './dto/stop-response.dto';

@Injectable()
export class StopsService {
  private readonly logger = new Logger(StopsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly analytics: AnalyticsService,
  ) {}

  /**
   * Lists all stops for a given trip with two-level IDOR check.
   */
  async listStops(
    user: AuthenticatedUser,
    tripId: string,
  ): Promise<StopResponse[]> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    const stops = await this.prisma.tripStop.findMany({
      where: { trip_id: tripId },
      include: { destination: true },
      orderBy: { stop_order: 'asc' },
    });

    return stops.map((s) => this.toStopResponse(s));
  }

  /**
   * Adds a new stop to a trip with destination validation, date bounds check, and auto-ordering.
   */
  async createStop(
    user: AuthenticatedUser,
    tripId: string,
    dto: CreateStopDto,
    requestId: string,
  ): Promise<StopResponse> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    const destination = await this.prisma.destination.findUnique({
      where: { id: dto.destination_id },
    });

    if (!destination) {
      throw new BadRequestException('Destination not found.');
    }

    const arrivalDate = new Date(dto.arrival_date);
    const departureDate = new Date(dto.departure_date);

    if (departureDate < arrivalDate) {
      throw new BadRequestException('departure_date must be greater than or equal to arrival_date.');
    }

    // Check bounds against parent trip
    if (arrivalDate < trip.start_date || departureDate > trip.end_date) {
      throw new BadRequestException(
        `Stop dates (${dto.arrival_date} to ${dto.departure_date}) must fall within trip dates (${trip.start_date.toISOString().split('T')[0]} to ${trip.end_date.toISOString().split('T')[0]}).`,
      );
    }

    // Determine stop order
    let stopOrder = dto.stop_order;
    if (!stopOrder) {
      const highestStop = await this.prisma.tripStop.findFirst({
        where: { trip_id: tripId },
        orderBy: { stop_order: 'desc' },
      });
      stopOrder = (highestStop?.stop_order || 0) + 1;
    }

    const stop = await this.prisma.tripStop.create({
      data: {
        trip_id: tripId,
        destination_id: dto.destination_id,
        arrival_date: arrivalDate,
        departure_date: departureDate,
        notes: dto.notes || null,
        stop_order: stopOrder,
      },
      include: {
        destination: true,
      },
    });

    await this.audit.log({
      action: 'STOP_CREATED',
      actor_user_id: user.id,
      resource_type: 'trip_stop',
      resource_id: stop.id,
      request_id: requestId,
      new_values: {
        trip_id: tripId,
        destination_id: dto.destination_id,
        stop_order: stopOrder,
      },
    });

    await this.analytics.track({
      user_id: user.id,
      event_type: 'STOP_ADDED',
      entity_type: 'trip_stop',
      entity_id: stop.id,
      metadata: { trip_id: tripId, destination_name: destination.name },
    });

    return this.toStopResponse(stop);
  }

  /**
   * Updates stop details with two-level IDOR and trip bounds verification.
   */
  async updateStop(
    user: AuthenticatedUser,
    tripId: string,
    stopId: string,
    dto: UpdateStopDto,
    requestId: string,
  ): Promise<StopResponse> {
    const stop = await this.prisma.tripStop.findUnique({
      where: { id: stopId },
      include: { trip: true, destination: true },
    });

    if (
      !stop ||
      stop.trip_id !== tripId ||
      stop.trip.user_id !== user.id ||
      stop.trip.deleted_at !== null
    ) {
      throw new NotFoundException('Trip stop not found.');
    }

    const newArrival = dto.arrival_date ? new Date(dto.arrival_date) : stop.arrival_date;
    const newDeparture = dto.departure_date ? new Date(dto.departure_date) : stop.departure_date;

    if (newDeparture < newArrival) {
      throw new BadRequestException('departure_date must be greater than or equal to arrival_date.');
    }

    if (newArrival < stop.trip.start_date || newDeparture > stop.trip.end_date) {
      throw new BadRequestException('Stop dates must fall within parent trip dates.');
    }

    const updated = await this.prisma.tripStop.update({
      where: { id: stopId },
      data: {
        arrival_date: dto.arrival_date ? newArrival : undefined,
        departure_date: dto.departure_date ? newDeparture : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        stop_order: dto.stop_order !== undefined ? dto.stop_order : undefined,
      },
      include: {
        destination: true,
      },
    });

    await this.audit.log({
      action: 'STOP_UPDATED',
      actor_user_id: user.id,
      resource_type: 'trip_stop',
      resource_id: stopId,
      request_id: requestId,
      new_values: dto as any,
    });

    return this.toStopResponse(updated);
  }

  /**
   * Deletes stop and re-normalizes sequential ordering of remaining stops.
   */
  async deleteStop(
    user: AuthenticatedUser,
    tripId: string,
    stopId: string,
    requestId: string,
  ): Promise<{ message: string }> {
    const stop = await this.prisma.tripStop.findUnique({
      where: { id: stopId },
      include: { trip: true },
    });

    if (
      !stop ||
      stop.trip_id !== tripId ||
      stop.trip.user_id !== user.id ||
      stop.trip.deleted_at !== null
    ) {
      throw new NotFoundException('Trip stop not found.');
    }

    await this.prisma.tripStop.delete({
      where: { id: stopId },
    });

    // Re-normalize ordering of remaining stops
    const remainingStops = await this.prisma.tripStop.findMany({
      where: { trip_id: tripId },
      orderBy: { stop_order: 'asc' },
    });

    for (let i = 0; i < remainingStops.length; i++) {
      if (remainingStops[i].stop_order !== i + 1) {
        await this.prisma.tripStop.update({
          where: { id: remainingStops[i].id },
          data: { stop_order: i + 1 },
        });
      }
    }

    await this.audit.log({
      action: 'STOP_DELETED',
      actor_user_id: user.id,
      resource_type: 'trip_stop',
      resource_id: stopId,
      request_id: requestId,
    });

    return { message: 'Trip stop deleted successfully' };
  }

  /**
   * Reorders stops in a trip with validation on stop membership.
   */
  async reorderStops(
    user: AuthenticatedUser,
    tripId: string,
    dto: ReorderStopsDto,
    requestId: string,
  ): Promise<StopResponse[]> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { stops: true },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    const existingStopIds = new Set(trip.stops.map((s) => s.id));
    const uniqueIncomingIds = new Set(dto.stop_ids);

    if (
      uniqueIncomingIds.size !== trip.stops.length ||
      dto.stop_ids.length !== trip.stops.length ||
      !dto.stop_ids.every((id) => existingStopIds.has(id))
    ) {
      throw new BadRequestException(
        'Invalid stop_ids provided. All stops in the trip must be present exactly once.',
      );
    }

    // Perform atomic reorder updates
    await this.prisma.$transaction(
      dto.stop_ids.map((id, index) =>
        this.prisma.tripStop.update({
          where: { id },
          data: { stop_order: index + 1 },
        }),
      ),
    );

    await this.audit.log({
      action: 'STOPS_REORDERED',
      actor_user_id: user.id,
      resource_type: 'trip',
      resource_id: tripId,
      request_id: requestId,
      new_values: { stop_ids_order: dto.stop_ids },
    });

    const updatedStops = await this.prisma.tripStop.findMany({
      where: { trip_id: tripId },
      include: { destination: true },
      orderBy: { stop_order: 'asc' },
    });

    return updatedStops.map((s) => this.toStopResponse(s));
  }

  private toStopResponse(stop: any): StopResponse {
    return {
      id: stop.id,
      trip_id: stop.trip_id,
      destination_id: stop.destination_id,
      stop_order: stop.stop_order,
      arrival_date: stop.arrival_date.toISOString().split('T')[0],
      departure_date: stop.departure_date.toISOString().split('T')[0],
      notes: stop.notes ?? null,
      destination: {
        id: stop.destination.id,
        name: stop.destination.name,
        country: stop.destination.country,
        country_code: stop.destination.country_code,
        image_url: stop.destination.image_url ?? null,
        latitude: stop.destination.latitude ? Number(stop.destination.latitude) : null,
        longitude: stop.destination.longitude ? Number(stop.destination.longitude) : null,
      },
      created_at: stop.created_at,
      updated_at: stop.updated_at,
    };
  }
}
