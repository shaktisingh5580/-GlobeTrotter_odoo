import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ActivityCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DestinationQueryDto } from './dto/destination-query.dto';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import {
  DestinationSummaryResponse,
  DestinationDetailResponse,
  ActivityResponse,
  SavedDestinationResponse,
} from './dto/destination-response.dto';

@Injectable()
export class DestinationsService {
  private readonly logger = new Logger(DestinationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Lists catalog destinations with keyword search, country/region filtering, pagination, and bookmark status.
   */
  async listDestinations(
    query: DestinationQueryDto,
    user?: AuthenticatedUser | null,
  ): Promise<{ items: DestinationSummaryResponse[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { country: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { region: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.country) {
      if (query.country.length <= 3) {
        where.country_code = query.country.toUpperCase();
      } else {
        where.country = { contains: query.country, mode: 'insensitive' };
      }
    }

    const orderBy: any = {};
    const sortField = ['name', 'created_at'].includes(query.sort)
      ? query.sort
      : 'popularity_score';
    orderBy[sortField] = query.order;

    const [total, destinations] = await Promise.all([
      this.prisma.destination.count({ where }),
      this.prisma.destination.findMany({
        where,
        orderBy,
        take: query.limit,
        skip: query.offset,
        include: {
          _count: {
            select: { activities: true },
          },
        },
      }),
    ]);

    // Check saved status for authenticated user
    let savedIds = new Set<string>();
    if (user) {
      const saved = await this.prisma.savedDestination.findMany({
        where: { user_id: user.id },
        select: { destination_id: true },
      });
      savedIds = new Set(saved.map((s) => s.destination_id));
    }

    const items: DestinationSummaryResponse[] = destinations.map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      country_code: d.country_code,
      region: d.region,
      description: d.description,
      image_url: d.image_url,
      latitude: d.latitude ? Number(d.latitude) : null,
      longitude: d.longitude ? Number(d.longitude) : null,
      timezone: d.timezone,
      cost_index: d.cost_index,
      popularity_score: d.popularity_score,
      activities_count: d._count.activities,
      is_saved: user ? savedIds.has(d.id) : false,
      created_at: d.created_at,
    }));

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
   * Retrieves single destination details including full activities list.
   */
  async getDestination(
    destinationId: string,
    user?: AuthenticatedUser | null,
  ): Promise<DestinationDetailResponse> {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      include: {
        activities: {
          orderBy: { rating: 'desc' },
        },
        _count: {
          select: { activities: true },
        },
      },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found.');
    }

    let isSaved = false;
    if (user) {
      const bookmark = await this.prisma.savedDestination.findUnique({
        where: {
          uq_user_dest: {
            user_id: user.id,
            destination_id: destinationId,
          },
        },
      });
      isSaved = !!bookmark;
    }

    return {
      id: destination.id,
      name: destination.name,
      country: destination.country,
      country_code: destination.country_code,
      region: destination.region,
      description: destination.description,
      image_url: destination.image_url,
      latitude: destination.latitude ? Number(destination.latitude) : null,
      longitude: destination.longitude ? Number(destination.longitude) : null,
      timezone: destination.timezone,
      cost_index: destination.cost_index,
      popularity_score: destination.popularity_score,
      activities_count: destination._count.activities,
      is_saved: isSaved,
      activities: destination.activities.map((a) => this.toActivityResponse(a)),
      created_at: destination.created_at,
      updated_at: destination.updated_at,
    };
  }

  /**
   * Admin-only: Creates a new destination in the discovery catalog.
   */
  async createDestination(
    dto: CreateDestinationDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<DestinationSummaryResponse> {
    const destination = await this.prisma.destination.create({
      data: {
        name: dto.name,
        country: dto.country,
        country_code: dto.country_code ? dto.country_code.toUpperCase() : null,
        region: dto.region || null,
        description: dto.description || null,
        image_url: dto.image_url || null,
        latitude: dto.latitude !== undefined ? dto.latitude : null,
        longitude: dto.longitude !== undefined ? dto.longitude : null,
        timezone: dto.timezone || null,
        cost_index: dto.cost_index !== undefined ? dto.cost_index : null,
        popularity_score: dto.popularity_score !== undefined ? dto.popularity_score : 0,
      },
      include: {
        _count: { select: { activities: true } },
      },
    });

    await this.audit.log({
      action: 'DESTINATION_CREATED',
      actor_user_id: user.id,
      resource_type: 'destination',
      resource_id: destination.id,
      request_id: requestId,
      new_values: { name: destination.name, country: destination.country },
    });

    return {
      id: destination.id,
      name: destination.name,
      country: destination.country,
      country_code: destination.country_code,
      region: destination.region,
      description: destination.description,
      image_url: destination.image_url,
      latitude: destination.latitude ? Number(destination.latitude) : null,
      longitude: destination.longitude ? Number(destination.longitude) : null,
      timezone: destination.timezone,
      cost_index: destination.cost_index,
      popularity_score: destination.popularity_score,
      activities_count: destination._count.activities,
      is_saved: false,
      created_at: destination.created_at,
    };
  }

  /**
   * Admin-only: Updates a destination.
   */
  async updateDestination(
    destinationId: string,
    dto: UpdateDestinationDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<DestinationSummaryResponse> {
    const existing = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!existing) {
      throw new NotFoundException('Destination not found.');
    }

    const updated = await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        name: dto.name !== undefined ? dto.name : undefined,
        country: dto.country !== undefined ? dto.country : undefined,
        country_code: dto.country_code !== undefined ? dto.country_code.toUpperCase() : undefined,
        region: dto.region !== undefined ? dto.region : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        image_url: dto.image_url !== undefined ? dto.image_url : undefined,
        latitude: dto.latitude !== undefined ? dto.latitude : undefined,
        longitude: dto.longitude !== undefined ? dto.longitude : undefined,
        timezone: dto.timezone !== undefined ? dto.timezone : undefined,
        cost_index: dto.cost_index !== undefined ? dto.cost_index : undefined,
        popularity_score: dto.popularity_score !== undefined ? dto.popularity_score : undefined,
      },
      include: {
        _count: { select: { activities: true } },
      },
    });

    await this.audit.log({
      action: 'DESTINATION_UPDATED',
      actor_user_id: user.id,
      resource_type: 'destination',
      resource_id: destinationId,
      request_id: requestId,
      new_values: dto as any,
    });

    return {
      id: updated.id,
      name: updated.name,
      country: updated.country,
      country_code: updated.country_code,
      region: updated.region,
      description: updated.description,
      image_url: updated.image_url,
      latitude: updated.latitude ? Number(updated.latitude) : null,
      longitude: updated.longitude ? Number(updated.longitude) : null,
      timezone: updated.timezone,
      cost_index: updated.cost_index,
      popularity_score: updated.popularity_score,
      activities_count: updated._count.activities,
      is_saved: false,
      created_at: updated.created_at,
    };
  }

  /**
   * Lists activities for a destination with optional category filtering.
   */
  async listActivities(
    destinationId: string,
    category?: ActivityCategory,
  ): Promise<ActivityResponse[]> {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found.');
    }

    const where: any = { destination_id: destinationId };
    if (category) {
      where.category = category;
    }

    const activities = await this.prisma.activity.findMany({
      where,
      orderBy: { rating: 'desc' },
    });

    return activities.map((a) => this.toActivityResponse(a));
  }

  /**
   * Admin-only: Adds an activity to a destination.
   */
  async createActivity(
    destinationId: string,
    dto: CreateActivityDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<ActivityResponse> {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found.');
    }

    const activity = await this.prisma.activity.create({
      data: {
        destination_id: destinationId,
        name: dto.name,
        description: dto.description || null,
        category: dto.category || 'SIGHTSEEING',
        estimated_cost: dto.estimated_cost !== undefined ? dto.estimated_cost : null,
        currency: dto.currency || 'INR',
        duration_minutes: dto.duration_minutes !== undefined ? dto.duration_minutes : null,
        image_url: dto.image_url || null,
        rating: dto.rating !== undefined ? dto.rating : null,
      },
    });

    await this.audit.log({
      action: 'ACTIVITY_CREATED',
      actor_user_id: user.id,
      resource_type: 'activity',
      resource_id: activity.id,
      request_id: requestId,
      new_values: { name: activity.name, destination_id: destinationId },
    });

    return this.toActivityResponse(activity);
  }

  /**
   * Saves/bookmarks a destination for the authenticated user (idempotent).
   */
  async saveDestination(
    destinationId: string,
    user: AuthenticatedUser,
    notes?: string,
  ): Promise<{ message: string }> {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found.');
    }

    await this.prisma.savedDestination.upsert({
      where: {
        uq_user_dest: {
          user_id: user.id,
          destination_id: destinationId,
        },
      },
      create: {
        user_id: user.id,
        destination_id: destinationId,
        notes: notes || null,
      },
      update: {
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return { message: 'Destination saved to bookmarks' };
  }

  /**
   * Removes a destination bookmark for the authenticated user.
   */
  async removeSavedDestination(
    destinationId: string,
    user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.prisma.savedDestination.deleteMany({
      where: {
        user_id: user.id,
        destination_id: destinationId,
      },
    });

    return { message: 'Destination removed from bookmarks' };
  }

  /**
   * Retrieves all saved destinations for the authenticated user.
   */
  async getUserSavedDestinations(
    user: AuthenticatedUser,
  ): Promise<SavedDestinationResponse[]> {
    const saved = await this.prisma.savedDestination.findMany({
      where: { user_id: user.id },
      include: {
        destination: {
          include: {
            _count: { select: { activities: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return saved.map((s) => ({
      id: s.id,
      user_id: s.user_id,
      destination_id: s.destination_id,
      notes: s.notes,
      saved_at: s.created_at,
      destination: {
        id: s.destination.id,
        name: s.destination.name,
        country: s.destination.country,
        country_code: s.destination.country_code,
        region: s.destination.region,
        description: s.destination.description,
        image_url: s.destination.image_url,
        latitude: s.destination.latitude ? Number(s.destination.latitude) : null,
        longitude: s.destination.longitude ? Number(s.destination.longitude) : null,
        timezone: s.destination.timezone,
        cost_index: s.destination.cost_index,
        popularity_score: s.destination.popularity_score,
        activities_count: s.destination._count.activities,
        is_saved: true,
        created_at: s.destination.created_at,
      },
    }));
  }

  private toActivityResponse(activity: any): ActivityResponse {
    return {
      id: activity.id,
      destination_id: activity.destination_id,
      name: activity.name,
      description: activity.description ?? null,
      category: activity.category,
      estimated_cost: activity.estimated_cost ? Number(activity.estimated_cost) : null,
      currency: activity.currency,
      duration_minutes: activity.duration_minutes ?? null,
      image_url: activity.image_url ?? null,
      rating: activity.rating ? Number(activity.rating) : null,
      created_at: activity.created_at,
    };
  }
}
