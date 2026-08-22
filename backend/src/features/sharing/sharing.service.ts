import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AppConfigService } from '../../config/config.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateShareDto } from './dto/create-share.dto';
import {
  ShareTokenResponse,
  SharedTripPublicResponse,
  CopyTripResponse,
} from './dto/share-response.dto';

@Injectable()
export class SharingService {
  private readonly logger = new Logger(SharingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Generates or refreshes a secure public share token for a trip.
   */
  async createShare(
    tripId: string,
    dto: CreateShareDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<ShareTokenResponse> {
    await this.verifyTripOwnership(tripId, user.id);

    // 16-character secure random hex token
    const token = crypto.randomBytes(8).toString('hex');

    let expiresAt: Date | null = null;
    if (dto.expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + dto.expires_in_days);
    }

    // Deactivate previous active shares for this trip
    await this.prisma.sharedTrip.updateMany({
      where: { trip_id: tripId, is_active: true },
      data: { is_active: false },
    });

    const share = await this.prisma.sharedTrip.create({
      data: {
        trip_id: tripId,
        share_token: token,
        visibility: dto.visibility || 'LINK_ONLY',
        expires_at: expiresAt,
        is_active: true,
      },
    });

    await this.audit.log({
      action: 'SHARE_CREATED',
      actor_user_id: user.id,
      resource_type: 'shared_trip',
      resource_id: share.id,
      request_id: requestId,
      new_values: {
        trip_id: tripId,
        visibility: share.visibility,
        expires_at: share.expires_at,
      },
    });

    const baseUrl = `http://localhost:${this.config.port}`;
    return {
      share_token: share.share_token,
      share_url: `${baseUrl}/shared/${share.share_token}`,
      visibility: share.visibility,
      expires_at: share.expires_at,
      created_at: share.created_at,
    };
  }

  /**
   * Public endpoint to view a shared trip without exposing any user PII or budget data.
   */
  async getSharedTrip(shareToken: string): Promise<SharedTripPublicResponse> {
    const share = await this.prisma.sharedTrip.findUnique({
      where: { share_token: shareToken },
      include: {
        trip: {
          include: {
            stops: {
              include: {
                destination: true,
                sections: true,
              },
              orderBy: { stop_order: 'asc' },
            },
          },
        },
      },
    });

    if (
      !share ||
      !share.is_active ||
      (share.expires_at && share.expires_at < new Date()) ||
      !share.trip ||
      share.trip.deleted_at !== null
    ) {
      throw new NotFoundException('Shared trip not found or link has expired.');
    }

    const trip = share.trip;

    return {
      title: trip.title,
      description: trip.description,
      start_date: this.formatDate(trip.start_date),
      end_date: this.formatDate(trip.end_date),
      status: trip.status,
      stops: trip.stops.map((s) => ({
        destination: {
          name: s.destination.name,
          country: s.destination.country,
          image_url: s.destination.image_url,
        },
        arrival_date: this.formatDate(s.arrival_date),
        departure_date: this.formatDate(s.departure_date),
        notes: s.notes,
        sections: s.sections.map((sec) => ({
          title: sec.title,
          section_type: sec.section_type,
          start_date: this.formatDate(sec.start_date),
          end_date: this.formatDate(sec.end_date),
        })),
      })),
    };
  }

  /**
   * Copies a shared trip into the authenticated user's account inside a database transaction.
   */
  async copySharedTrip(
    shareToken: string,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<CopyTripResponse> {
    const share = await this.prisma.sharedTrip.findUnique({
      where: { share_token: shareToken },
      include: {
        trip: {
          include: {
            stops: {
              include: {
                itinerary_items: true,
              },
            },
            sections: true,
          },
        },
      },
    });

    if (
      !share ||
      !share.is_active ||
      (share.expires_at && share.expires_at < new Date()) ||
      !share.trip ||
      share.trip.deleted_at !== null
    ) {
      throw new NotFoundException('Shared trip not found or link has expired.');
    }

    const origTrip = share.trip;

    const newTrip = await this.prisma.$transaction(async (tx) => {
      // 1. Create base trip
      const createdTrip = await tx.trip.create({
        data: {
          user_id: user.id,
          title: `Copy of ${origTrip.title}`,
          description: origTrip.description,
          start_date: origTrip.start_date,
          end_date: origTrip.end_date,
          budget_limit: origTrip.budget_limit,
          currency: origTrip.currency,
          status: 'DRAFT',
          copied_from_trip_id: origTrip.id,
        },
      });

      // 2. Clone stops and track ID mappings
      const stopIdMap = new Map<string, string>();
      for (const stop of origTrip.stops) {
        const newStop = await tx.tripStop.create({
          data: {
            trip_id: createdTrip.id,
            destination_id: stop.destination_id,
            stop_order: stop.stop_order,
            arrival_date: stop.arrival_date,
            departure_date: stop.departure_date,
            notes: stop.notes,
          },
        });
        stopIdMap.set(stop.id, newStop.id);
      }

      // 3. Clone sections and track ID mappings
      const sectionIdMap = new Map<string, string>();
      for (const sec of origTrip.sections) {
        const newSec = await tx.tripSection.create({
          data: {
            trip_id: createdTrip.id,
            trip_stop_id: sec.trip_stop_id ? stopIdMap.get(sec.trip_stop_id) || null : null,
            title: sec.title,
            description: sec.description,
            section_type: sec.section_type,
            start_date: sec.start_date,
            end_date: sec.end_date,
            planned_budget: sec.planned_budget,
            currency: sec.currency,
            section_order: sec.section_order,
          },
        });
        sectionIdMap.set(sec.id, newSec.id);
      }

      // 4. Clone itinerary items
      for (const stop of origTrip.stops) {
        const newStopId = stopIdMap.get(stop.id);
        if (newStopId) {
          for (const item of stop.itinerary_items) {
            await tx.itineraryItem.create({
              data: {
                trip_stop_id: newStopId,
                trip_section_id: item.trip_section_id
                  ? sectionIdMap.get(item.trip_section_id) || null
                  : null,
                activity_id: item.activity_id,
                item_date: item.item_date,
                start_time: item.start_time,
                end_time: item.end_time,
                item_order: item.item_order,
                custom_title: item.custom_title,
                custom_description: item.custom_description,
                notes: item.notes,
              },
            });
          }
        }
      }

      return createdTrip;
    });

    await this.audit.log({
      action: 'TRIP_COPIED',
      actor_user_id: user.id,
      resource_type: 'trip',
      resource_id: newTrip.id,
      request_id: requestId,
      new_values: {
        copied_from: origTrip.id,
        new_trip_id: newTrip.id,
      },
    });

    return {
      trip_id: newTrip.id,
      message: 'Trip copied successfully to your account.',
      copied_from: origTrip.id,
    };
  }

  /**
   * Revokes all active share tokens for a trip.
   */
  async revokeShare(
    tripId: string,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<{ message: string }> {
    await this.verifyTripOwnership(tripId, user.id);

    await this.prisma.sharedTrip.updateMany({
      where: { trip_id: tripId, is_active: true },
      data: { is_active: false },
    });

    await this.audit.log({
      action: 'SHARE_REVOKED',
      actor_user_id: user.id,
      resource_type: 'trip',
      resource_id: tripId,
      request_id: requestId,
    });

    return { message: 'Trip share link revoked successfully.' };
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

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date.slice(0, 10);
    return date.toISOString().slice(0, 10);
  }
}
