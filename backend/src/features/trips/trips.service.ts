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
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripQueryDto } from './dto/trip-query.dto';
import {
  TripSummaryResponse,
  TripDetailResponse,
  TripFullResponse,
} from './dto/trip-response.dto';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly analytics: AnalyticsService,
  ) {}

  /**
   * Lists all trips belonging to the authenticated user with status filtering, sorting, and pagination.
   */
  async listTrips(
    user: AuthenticatedUser,
    query: TripQueryDto,
    hostUrl?: string,
  ): Promise<{ items: TripSummaryResponse[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    const where: any = {
      user_id: user.id,
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    const orderBy: any = {};
    const sortField = query.sort === 'created_at' ? 'created_at' : 'start_date';
    orderBy[sortField] = query.order;

    const [total, trips] = await Promise.all([
      this.prisma.trip.count({ where }),
      this.prisma.trip.findMany({
        where,
        orderBy,
        take: query.limit,
        skip: query.offset,
        include: {
          cover_file: true,
          _count: {
            select: { stops: true },
          },
          expenses: {
            select: { amount: true },
          },
        },
      }),
    ]);

    const items: TripSummaryResponse[] = trips.map((t) => {
      const totalExpenses = t.expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0,
      );

      return {
        id: t.id,
        title: t.title,
        description: t.description,
        start_date: t.start_date.toISOString().split('T')[0],
        end_date: t.end_date.toISOString().split('T')[0],
        budget_limit: t.budget_limit ? Number(t.budget_limit) : null,
        currency: t.currency,
        cover_url: t.cover_file
          ? `${hostUrl || ''}/uploads/${t.cover_file.storage_key}`
          : null,
        status: t.status,
        stops_count: t._count.stops,
        total_expenses: totalExpenses,
        created_at: t.created_at,
      };
    });

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
   * Creates a new trip strictly owned by the authenticated user.
   */
  async createTrip(
    user: AuthenticatedUser,
    dto: CreateTripDto,
    requestId: string,
    hostUrl?: string,
  ): Promise<TripSummaryResponse> {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (endDate < startDate) {
      throw new BadRequestException('end_date must be greater than or equal to start_date.');
    }

    if (dto.cover_file_id) {
      const coverFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.cover_file_id },
      });
      if (!coverFile || coverFile.deleted_at !== null || coverFile.owner_user_id !== user.id) {
        throw new BadRequestException(
          'Invalid cover file ID. File does not exist or does not belong to you.',
        );
      }
    }

    const trip = await this.prisma.trip.create({
      data: {
        user_id: user.id,
        title: dto.title,
        description: dto.description || null,
        start_date: startDate,
        end_date: endDate,
        budget_limit: dto.budget_limit !== undefined ? dto.budget_limit : null,
        currency: dto.currency || 'INR',
        cover_file_id: dto.cover_file_id || null,
        status: dto.status || 'DRAFT',
      },
      include: {
        cover_file: true,
      },
    });

    await this.audit.log({
      action: 'TRIP_CREATED',
      actor_user_id: user.id,
      resource_type: 'trip',
      resource_id: trip.id,
      request_id: requestId,
      new_values: {
        title: trip.title,
        start_date: trip.start_date,
        end_date: trip.end_date,
        budget_limit: trip.budget_limit,
      },
    });

    await this.analytics.track({
      user_id: user.id,
      event_type: 'TRIP_CREATED',
      entity_type: 'trip',
      entity_id: trip.id,
      metadata: { title: trip.title },
    });

    return {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      start_date: trip.start_date.toISOString().split('T')[0],
      end_date: trip.end_date.toISOString().split('T')[0],
      budget_limit: trip.budget_limit ? Number(trip.budget_limit) : null,
      currency: trip.currency,
      cover_url: trip.cover_file
        ? `${hostUrl || ''}/uploads/${trip.cover_file.storage_key}`
        : null,
      status: trip.status,
      stops_count: 0,
      total_expenses: 0,
      created_at: trip.created_at,
    };
  }

  /**
   * Retrieves single trip with stops and destination details, enforcing IDOR ownership.
   */
  async getTrip(
    user: AuthenticatedUser,
    tripId: string,
    hostUrl?: string,
  ): Promise<TripDetailResponse> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        cover_file: true,
        stops: {
          include: { destination: true },
          orderBy: { stop_order: 'asc' },
        },
        expenses: {
          select: { amount: true },
        },
      },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    const totalExpenses = trip.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    return {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      start_date: trip.start_date.toISOString().split('T')[0],
      end_date: trip.end_date.toISOString().split('T')[0],
      budget_limit: trip.budget_limit ? Number(trip.budget_limit) : null,
      currency: trip.currency,
      cover_url: trip.cover_file
        ? `${hostUrl || ''}/uploads/${trip.cover_file.storage_key}`
        : null,
      status: trip.status,
      stops_count: trip.stops.length,
      total_expenses: totalExpenses,
      stops: trip.stops.map((s) => ({
        id: s.id,
        stop_order: s.stop_order,
        arrival_date: s.arrival_date.toISOString().split('T')[0],
        departure_date: s.departure_date.toISOString().split('T')[0],
        notes: s.notes,
        destination: {
          id: s.destination.id,
          name: s.destination.name,
          country: s.destination.country,
          country_code: s.destination.country_code,
          image_url: s.destination.image_url,
        },
      })),
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    };
  }

  /**
   * Updates an existing trip with ownership validation and date integrity checks.
   */
  async updateTrip(
    user: AuthenticatedUser,
    tripId: string,
    dto: UpdateTripDto,
    requestId: string,
    hostUrl?: string,
  ): Promise<TripDetailResponse> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        cover_file: true,
        stops: { include: { destination: true }, orderBy: { stop_order: 'asc' } },
        expenses: { select: { amount: true } },
      },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    const newStart = dto.start_date ? new Date(dto.start_date) : trip.start_date;
    const newEnd = dto.end_date ? new Date(dto.end_date) : trip.end_date;

    if (newEnd < newStart) {
      throw new BadRequestException('end_date must be greater than or equal to start_date.');
    }

    if (dto.cover_file_id) {
      const coverFile = await this.prisma.mediaFile.findUnique({
        where: { id: dto.cover_file_id },
      });
      if (!coverFile || coverFile.deleted_at !== null || coverFile.owner_user_id !== user.id) {
        throw new BadRequestException(
          'Invalid cover file ID. File does not exist or does not belong to you.',
        );
      }
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        start_date: dto.start_date ? newStart : undefined,
        end_date: dto.end_date ? newEnd : undefined,
        budget_limit: dto.budget_limit !== undefined ? dto.budget_limit : undefined,
        currency: dto.currency !== undefined ? dto.currency : undefined,
        cover_file_id: dto.cover_file_id !== undefined ? dto.cover_file_id : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
      },
      include: {
        cover_file: true,
        stops: { include: { destination: true }, orderBy: { stop_order: 'asc' } },
        expenses: { select: { amount: true } },
      },
    });

    await this.audit.log({
      action: 'TRIP_UPDATED',
      actor_user_id: user.id,
      resource_type: 'trip',
      resource_id: tripId,
      request_id: requestId,
      new_values: dto as any,
    });

    if (dto.status === 'COMPLETED' && trip.status !== 'COMPLETED') {
      await this.analytics.track({
        user_id: user.id,
        event_type: 'TRIP_COMPLETED',
        entity_type: 'trip',
        entity_id: tripId,
      });
    }

    const totalExpenses = updated.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      start_date: updated.start_date.toISOString().split('T')[0],
      end_date: updated.end_date.toISOString().split('T')[0],
      budget_limit: updated.budget_limit ? Number(updated.budget_limit) : null,
      currency: updated.currency,
      cover_url: updated.cover_file
        ? `${hostUrl || ''}/uploads/${updated.cover_file.storage_key}`
        : null,
      status: updated.status,
      stops_count: updated.stops.length,
      total_expenses: totalExpenses,
      stops: updated.stops.map((s) => ({
        id: s.id,
        stop_order: s.stop_order,
        arrival_date: s.arrival_date.toISOString().split('T')[0],
        departure_date: s.departure_date.toISOString().split('T')[0],
        notes: s.notes,
        destination: {
          id: s.destination.id,
          name: s.destination.name,
          country: s.destination.country,
        },
      })),
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Soft-deletes a trip with strict IDOR verification.
   */
  async deleteTrip(
    user: AuthenticatedUser,
    tripId: string,
    requestId: string,
  ): Promise<{ message: string }> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    await this.prisma.trip.update({
      where: { id: tripId },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      action: 'TRIP_DELETED',
      actor_user_id: user.id,
      resource_type: 'trip',
      resource_id: tripId,
      request_id: requestId,
    });

    return { message: 'Trip deleted successfully' };
  }

  /**
   * Retrieves the entire composite trip graph (stops, sections with actual_spent, items, budget summary).
   */
  async getFullTrip(
    user: AuthenticatedUser,
    tripId: string,
    hostUrl?: string,
  ): Promise<TripFullResponse> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        cover_file: true,
        stops: {
          include: {
            destination: true,
            itinerary_items: {
              include: {
                activity: true,
                trip_section: true,
              },
              orderBy: { item_order: 'asc' },
            },
          },
          orderBy: { stop_order: 'asc' },
        },
        sections: {
          where: { deleted_at: null },
          include: {
            trip_stop: {
              include: { destination: true },
            },
          },
          orderBy: { section_order: 'asc' },
        },
        expenses: true,
      },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    // Compute overall budget summary
    const totalBudget = trip.budget_limit ? Number(trip.budget_limit) : 0;
    const totalSpent = trip.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const remaining = totalBudget - totalSpent;

    // Compute actual_spent per section
    const formattedSections = trip.sections.map((sec) => {
      const sectionExpenses = trip.expenses
        .filter((e) => e.trip_section_id === sec.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        id: sec.id,
        title: sec.title,
        description: sec.description,
        section_type: sec.section_type,
        start_date: sec.start_date.toISOString().split('T')[0],
        end_date: sec.end_date.toISOString().split('T')[0],
        planned_budget: sec.planned_budget ? Number(sec.planned_budget) : null,
        actual_spent: sectionExpenses,
        currency: sec.currency,
        section_order: sec.section_order,
        linked_stop: sec.trip_stop
          ? {
              id: sec.trip_stop.id,
              destination_name: sec.trip_stop.destination.name,
            }
          : null,
      };
    });

    // Format stops and nested itinerary items
    const formattedStops = trip.stops.map((stop) => ({
      id: stop.id,
      stop_order: stop.stop_order,
      arrival_date: stop.arrival_date.toISOString().split('T')[0],
      departure_date: stop.departure_date.toISOString().split('T')[0],
      notes: stop.notes,
      destination: {
        id: stop.destination.id,
        name: stop.destination.name,
        country: stop.destination.country,
        country_code: stop.destination.country_code,
        image_url: stop.destination.image_url,
      },
      itinerary_items: stop.itinerary_items.map((item) => ({
        id: item.id,
        item_date: item.item_date.toISOString().split('T')[0],
        start_time: item.start_time,
        end_time: item.end_time,
        item_order: item.item_order,
        custom_title: item.custom_title,
        custom_description: item.custom_description,
        notes: item.notes,
        activity: item.activity
          ? {
              id: item.activity.id,
              name: item.activity.name,
              category: item.activity.category,
              estimated_cost: item.activity.estimated_cost
                ? Number(item.activity.estimated_cost)
                : null,
            }
          : null,
        section: item.trip_section
          ? {
              id: item.trip_section.id,
              title: item.trip_section.title,
              section_type: item.trip_section.section_type,
            }
          : null,
      })),
    }));

    return {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      start_date: trip.start_date.toISOString().split('T')[0],
      end_date: trip.end_date.toISOString().split('T')[0],
      budget_limit: trip.budget_limit ? Number(trip.budget_limit) : null,
      currency: trip.currency,
      cover_url: trip.cover_file
        ? `${hostUrl || ''}/uploads/${trip.cover_file.storage_key}`
        : null,
      status: trip.status,
      stops: formattedStops,
      sections: formattedSections,
      budget_summary: {
        total_budget: totalBudget,
        total_spent: totalSpent,
        remaining,
      },
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    };
  }
}
