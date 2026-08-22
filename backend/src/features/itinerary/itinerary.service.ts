import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateItineraryItemDto } from './dto/create-itinerary-item.dto';
import { UpdateItineraryItemDto } from './dto/update-itinerary-item.dto';
import { ReorderItineraryItemsDto } from './dto/reorder-itinerary-items.dto';
import {
  ItineraryItemResponse,
  TripItineraryResponse,
  ItineraryDayResponse,
  ItineraryCalendarResponse,
  ItineraryTimelineResponse,
} from './dto/itinerary-response.dto';

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Retrieves the full itinerary for a trip grouped by date.
   */
  async getTripItinerary(
    tripId: string,
    user: AuthenticatedUser,
  ): Promise<TripItineraryResponse> {
    await this.verifyTripOwnership(tripId, user.id);

    const items = await this.prisma.itineraryItem.findMany({
      where: {
        trip_stop: {
          trip_id: tripId,
        },
      },
      include: {
        trip_stop: {
          include: {
            destination: true,
          },
        },
        trip_section: true,
        activity: true,
        expenses: true,
      },
      orderBy: [
        { item_date: 'asc' },
        { item_order: 'asc' },
        { start_time: 'asc' },
      ],
    });

    // Group items by date string (YYYY-MM-DD)
    const dayMap = new Map<string, { stop: any; items: ItineraryItemResponse[] }>();

    for (const item of items) {
      const dateKey = this.formatDate(item.item_date);
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          stop: item.trip_stop
            ? {
                id: item.trip_stop.id,
                destination_id: item.trip_stop.destination_id,
                destination_name: item.trip_stop.destination?.name || 'Unknown',
                country: item.trip_stop.destination?.country || '',
              }
            : null,
          items: [],
        });
      }
      dayMap.get(dateKey)!.items.push(this.toItemResponse(item));
    }

    const days: ItineraryDayResponse[] = Array.from(dayMap.entries()).map(
      ([date, data]) => ({
        date,
        stop: data.stop,
        items: data.items,
      }),
    );

    return {
      trip_id: tripId,
      days,
    };
  }

  /**
   * Creates a new itinerary item with cross-parent validation and date constraint checks.
   */
  async createItineraryItem(
    tripId: string,
    dto: CreateItineraryItemDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<ItineraryItemResponse> {
    await this.verifyTripOwnership(tripId, user.id);

    // 1. Verify Stop belongs to this trip
    const stop = await this.prisma.tripStop.findFirst({
      where: { id: dto.trip_stop_id, trip_id: tripId },
    });

    if (!stop) {
      throw new NotFoundException('Trip stop not found for this trip.');
    }

    // 2. Verify Item Date falls within Stop's arrival & departure range
    const itemDate = new Date(dto.item_date);
    const stopArrival = new Date(stop.arrival_date);
    const stopDeparture = new Date(stop.departure_date);

    if (itemDate < stopArrival || itemDate > stopDeparture) {
      throw new BadRequestException(
        `item_date (${dto.item_date}) must fall within stop arrival (${this.formatDate(stop.arrival_date)}) and departure (${this.formatDate(stop.departure_date)}).`,
      );
    }

    // 3. Cross-Parent Validation: If section provided, ensure it belongs to this trip
    if (dto.trip_section_id) {
      const section = await this.prisma.tripSection.findFirst({
        where: { id: dto.trip_section_id, trip_id: tripId, deleted_at: null },
      });
      if (!section) {
        throw new NotFoundException('Trip section not found for this trip.');
      }
    }

    // 4. Validate Activity if provided
    if (dto.activity_id) {
      const activity = await this.prisma.activity.findUnique({
        where: { id: dto.activity_id },
      });
      if (!activity) {
        throw new NotFoundException('Activity not found.');
      }
    }

    // 5. Validate start_time and end_time order
    if (dto.start_time && dto.end_time) {
      if (dto.end_time <= dto.start_time) {
        throw new BadRequestException('end_time must be after start_time.');
      }
    }

    // 6. Check unique order within (trip_stop_id, item_date, item_order)
    const existingOrder = await this.prisma.itineraryItem.findFirst({
      where: {
        trip_stop_id: dto.trip_stop_id,
        item_date: itemDate,
        item_order: dto.item_order,
      },
    });

    if (existingOrder) {
      throw new ConflictException(
        `An itinerary item already exists with order ${dto.item_order} on this date.`,
      );
    }

    const created = await this.prisma.itineraryItem.create({
      data: {
        trip_stop_id: dto.trip_stop_id,
        trip_section_id: dto.trip_section_id || null,
        activity_id: dto.activity_id || null,
        item_date: itemDate,
        start_time: dto.start_time || null,
        end_time: dto.end_time || null,
        item_order: dto.item_order,
        custom_title: dto.custom_title || null,
        custom_description: dto.custom_description || null,
        notes: dto.notes || null,
      },
      include: {
        activity: true,
        trip_section: true,
        expenses: true,
      },
    });

    await this.audit.log({
      action: 'ITEM_CREATED',
      actor_user_id: user.id,
      resource_type: 'itinerary_item',
      resource_id: created.id,
      request_id: requestId,
      new_values: {
        trip_id: tripId,
        item_date: dto.item_date,
        title: dto.custom_title || created.activity?.name,
      },
    });

    return this.toItemResponse(created);
  }

  /**
   * Updates an itinerary item with IDOR protection and cross-parent checks.
   */
  async updateItineraryItem(
    tripId: string,
    itemId: string,
    dto: UpdateItineraryItemDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<ItineraryItemResponse> {
    await this.verifyTripOwnership(tripId, user.id);

    const existing = await this.prisma.itineraryItem.findFirst({
      where: {
        id: itemId,
        trip_stop: {
          trip_id: tripId,
        },
      },
      include: {
        trip_stop: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Itinerary item not found for this trip.');
    }

    const stopId = dto.trip_stop_id || existing.trip_stop_id;
    let stop = existing.trip_stop;

    if (dto.trip_stop_id && dto.trip_stop_id !== existing.trip_stop_id) {
      const foundStop = await this.prisma.tripStop.findFirst({
        where: { id: dto.trip_stop_id, trip_id: tripId },
      });
      if (!foundStop) {
        throw new NotFoundException('Trip stop not found for this trip.');
      }
      stop = foundStop;
    }

    const itemDate = dto.item_date ? new Date(dto.item_date) : existing.item_date;
    if (dto.item_date || dto.trip_stop_id) {
      const stopArrival = new Date(stop.arrival_date);
      const stopDeparture = new Date(stop.departure_date);
      if (itemDate < stopArrival || itemDate > stopDeparture) {
        throw new BadRequestException(
          `item_date must fall within stop dates (${this.formatDate(stop.arrival_date)} to ${this.formatDate(stop.departure_date)}).`,
        );
      }
    }

    if (dto.trip_section_id !== undefined && dto.trip_section_id !== null) {
      const section = await this.prisma.tripSection.findFirst({
        where: { id: dto.trip_section_id, trip_id: tripId, deleted_at: null },
      });
      if (!section) {
        throw new NotFoundException('Trip section not found for this trip.');
      }
    }

    if (dto.activity_id !== undefined && dto.activity_id !== null) {
      const activity = await this.prisma.activity.findUnique({
        where: { id: dto.activity_id },
      });
      if (!activity) {
        throw new NotFoundException('Activity not found.');
      }
    }

    const startTime = dto.start_time !== undefined ? dto.start_time : existing.start_time;
    const endTime = dto.end_time !== undefined ? dto.end_time : existing.end_time;
    if (startTime && endTime && endTime <= startTime) {
      throw new BadRequestException('end_time must be after start_time.');
    }

    const updated = await this.prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        trip_stop_id: dto.trip_stop_id !== undefined ? dto.trip_stop_id : undefined,
        trip_section_id: dto.trip_section_id !== undefined ? dto.trip_section_id : undefined,
        activity_id: dto.activity_id !== undefined ? dto.activity_id : undefined,
        item_date: dto.item_date ? new Date(dto.item_date) : undefined,
        start_time: dto.start_time !== undefined ? dto.start_time : undefined,
        end_time: dto.end_time !== undefined ? dto.end_time : undefined,
        item_order: dto.item_order !== undefined ? dto.item_order : undefined,
        custom_title: dto.custom_title !== undefined ? dto.custom_title : undefined,
        custom_description: dto.custom_description !== undefined ? dto.custom_description : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
      include: {
        activity: true,
        trip_section: true,
        expenses: true,
      },
    });

    await this.audit.log({
      action: 'ITEM_UPDATED',
      actor_user_id: user.id,
      resource_type: 'itinerary_item',
      resource_id: itemId,
      request_id: requestId,
      new_values: dto as any,
    });

    return this.toItemResponse(updated);
  }

  /**
   * Deletes an itinerary item.
   */
  async deleteItineraryItem(
    tripId: string,
    itemId: string,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<{ message: string }> {
    await this.verifyTripOwnership(tripId, user.id);

    const existing = await this.prisma.itineraryItem.findFirst({
      where: {
        id: itemId,
        trip_stop: {
          trip_id: tripId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Itinerary item not found for this trip.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Unlink expenses linked to this itinerary item
      await tx.expense.updateMany({
        where: { itinerary_item_id: itemId },
        data: { itinerary_item_id: null },
      });

      // Delete the item
      await tx.itineraryItem.delete({
        where: { id: itemId },
      });
    });

    await this.audit.log({
      action: 'ITEM_DELETED',
      actor_user_id: user.id,
      resource_type: 'itinerary_item',
      resource_id: itemId,
      request_id: requestId,
    });

    return { message: 'Itinerary item deleted successfully.' };
  }

  /**
   * Atomically reorders itinerary items on a specific stop & date using two-phase order shifting.
   */
  async reorderItineraryItems(
    tripId: string,
    dto: ReorderItineraryItemsDto,
    user: AuthenticatedUser,
  ): Promise<ItineraryItemResponse[]> {
    await this.verifyTripOwnership(tripId, user.id);

    const itemIds = dto.order.map((o) => o.id);
    const existingItems = await this.prisma.itineraryItem.findMany({
      where: {
        id: { in: itemIds },
        trip_stop: {
          trip_id: tripId,
        },
      },
    });

    if (existingItems.length !== itemIds.length) {
      throw new NotFoundException('One or more itinerary items not found in this trip.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Phase 1: Set temporary negative order to prevent unique collision
      for (let i = 0; i < dto.order.length; i++) {
        await tx.itineraryItem.update({
          where: { id: dto.order[i].id },
          data: { item_order: -(i + 1000) },
        });
      }

      // Phase 2: Set target order
      for (const item of dto.order) {
        await tx.itineraryItem.update({
          where: { id: item.id },
          data: { item_order: item.item_order },
        });
      }
    });

    const updated = await this.prisma.itineraryItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        activity: true,
        trip_section: true,
        expenses: true,
      },
      orderBy: { item_order: 'asc' },
    });

    return updated.map((i) => this.toItemResponse(i));
  }

  /**
   * Retrieves calendar overview with items count and expense sum per date.
   */
  async getItineraryCalendar(
    tripId: string,
    user: AuthenticatedUser,
  ): Promise<ItineraryCalendarResponse> {
    const trip = await this.verifyTripOwnership(tripId, user.id);

    const [items, expenses, stops] = await Promise.all([
      this.prisma.itineraryItem.findMany({
        where: { trip_stop: { trip_id: tripId } },
        include: { trip_stop: { include: { destination: true } } },
      }),
      this.prisma.expense.findMany({
        where: { trip_id: tripId },
      }),
      this.prisma.tripStop.findMany({
        where: { trip_id: tripId },
        include: { destination: true },
        orderBy: { stop_order: 'asc' },
      }),
    ]);

    // Build day map for all dates between trip start and end
    const calendar: any[] = [];
    const currentDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);

    while (currentDate <= endDate) {
      const dateStr = this.formatDate(currentDate);

      // Find matching stop for this date
      const matchingStop = stops.find((s) => {
        const arr = this.formatDate(s.arrival_date);
        const dep = this.formatDate(s.departure_date);
        return dateStr >= arr && dateStr <= dep;
      });

      // Count items on this date
      const count = items.filter(
        (i) => this.formatDate(i.item_date) === dateStr,
      ).length;

      // Sum expenses on this date
      const expenseTotal = expenses
        .filter((e) => this.formatDate(e.expense_date) === dateStr)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      calendar.push({
        date: dateStr,
        stop: matchingStop?.destination?.name || null,
        items_count: count,
        total_expense: expenseTotal,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      trip_id: trip.id,
      start_date: this.formatDate(trip.start_date),
      end_date: this.formatDate(trip.end_date),
      calendar,
    };
  }

  /**
   * Retrieves linear chronological timeline of items.
   */
  async getItineraryTimeline(
    tripId: string,
    user: AuthenticatedUser,
  ): Promise<ItineraryTimelineResponse> {
    await this.verifyTripOwnership(tripId, user.id);

    const items = await this.prisma.itineraryItem.findMany({
      where: { trip_stop: { trip_id: tripId } },
      include: {
        trip_stop: { include: { destination: true } },
        trip_section: true,
        activity: true,
      },
      orderBy: [
        { item_date: 'asc' },
        { start_time: 'asc' },
        { item_order: 'asc' },
      ],
    });

    const timeline = items.map((i) => ({
      id: i.id,
      item_date: this.formatDate(i.item_date),
      start_time: i.start_time,
      end_time: i.end_time,
      title: i.custom_title || i.activity?.name || 'Activity',
      description: i.custom_description || i.activity?.description || null,
      category: i.activity?.category || null,
      duration_minutes: i.activity?.duration_minutes || null,
      stop_name: i.trip_stop?.destination?.name || null,
      section_title: i.trip_section?.title || null,
      estimated_cost: i.activity?.estimated_cost ? Number(i.activity.estimated_cost) : null,
      currency: i.activity?.currency || null,
    }));

    return {
      trip_id: tripId,
      timeline,
    };
  }

  private async verifyTripOwnership(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, user_id: userId, deleted_at: null },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found.');
    }

    return trip;
  }

  private toItemResponse(item: any): ItineraryItemResponse {
    return {
      id: item.id,
      trip_stop_id: item.trip_stop_id,
      trip_section_id: item.trip_section_id ?? null,
      activity_id: item.activity_id ?? null,
      item_date: this.formatDate(item.item_date),
      start_time: item.start_time ?? null,
      end_time: item.end_time ?? null,
      item_order: item.item_order,
      custom_title: item.custom_title ?? null,
      custom_description: item.custom_description ?? null,
      notes: item.notes ?? null,
      activity: item.activity
        ? {
            id: item.activity.id,
            name: item.activity.name,
            description: item.activity.description ?? null,
            category: item.activity.category,
            estimated_cost: item.activity.estimated_cost
              ? Number(item.activity.estimated_cost)
              : null,
            currency: item.activity.currency,
            duration_minutes: item.activity.duration_minutes ?? null,
            rating: item.activity.rating ? Number(item.activity.rating) : null,
          }
        : null,
      section: item.trip_section
        ? {
            id: item.trip_section.id,
            title: item.trip_section.title,
            section_type: item.trip_section.section_type,
          }
        : null,
      expenses: item.expenses
        ? item.expenses.map((e: any) => ({
            id: e.id,
            title: e.title,
            amount: Number(e.amount),
            currency: e.currency,
            category: e.category,
          }))
        : [],
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date.slice(0, 10);
    return date.toISOString().slice(0, 10);
  }
}
