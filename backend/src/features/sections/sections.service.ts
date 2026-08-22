import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { SectionResponse } from './dto/section-response.dto';

@Injectable()
export class SectionsService {
  private readonly logger = new Logger(SectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Lists all active sections for a trip with computed actual_spent and linked stop details.
   */
  async listSections(
    user: AuthenticatedUser,
    tripId: string,
  ): Promise<SectionResponse[]> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    const sections = await this.prisma.tripSection.findMany({
      where: { trip_id: tripId, deleted_at: null },
      include: {
        trip_stop: {
          include: { destination: true },
        },
        expenses: {
          select: { amount: true },
        },
      },
      orderBy: { section_order: 'asc' },
    });

    return sections.map((s) => this.toSectionResponse(s));
  }

  /**
   * Creates a new trip section with parent trip bounds validation, stop linking, and auto-ordering.
   */
  async createSection(
    user: AuthenticatedUser,
    tripId: string,
    dto: CreateSectionDto,
    requestId: string,
  ): Promise<SectionResponse> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    // Verify linked trip stop if provided
    if (dto.trip_stop_id) {
      const stop = await this.prisma.tripStop.findUnique({
        where: { id: dto.trip_stop_id },
      });
      if (!stop || stop.trip_id !== tripId) {
        throw new BadRequestException('Linked trip stop does not belong to this trip.');
      }
    }

    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (endDate < startDate) {
      throw new BadRequestException('end_date must be greater than or equal to start_date.');
    }

    if (startDate < trip.start_date || endDate > trip.end_date) {
      throw new BadRequestException(
        `Section dates (${dto.start_date} to ${dto.end_date}) must fall within trip dates (${trip.start_date.toISOString().split('T')[0]} to ${trip.end_date.toISOString().split('T')[0]}).`,
      );
    }

    // Determine section order
    let sectionOrder = dto.section_order;
    if (!sectionOrder) {
      const highestSection = await this.prisma.tripSection.findFirst({
        where: { trip_id: tripId, deleted_at: null },
        orderBy: { section_order: 'desc' },
      });
      sectionOrder = (highestSection?.section_order || 0) + 1;
    }

    const section = await this.prisma.tripSection.create({
      data: {
        trip_id: tripId,
        trip_stop_id: dto.trip_stop_id || null,
        title: dto.title,
        description: dto.description || null,
        section_type: dto.section_type || 'CUSTOM',
        start_date: startDate,
        end_date: endDate,
        planned_budget: dto.planned_budget !== undefined ? dto.planned_budget : null,
        currency: dto.currency || trip.currency || 'INR',
        section_order: sectionOrder,
      },
      include: {
        trip_stop: {
          include: { destination: true },
        },
        expenses: {
          select: { amount: true },
        },
      },
    });

    await this.audit.log({
      action: 'SECTION_CREATED',
      actor_user_id: user.id,
      resource_type: 'trip_section',
      resource_id: section.id,
      request_id: requestId,
      new_values: {
        trip_id: tripId,
        title: section.title,
        section_type: section.section_type,
        planned_budget: section.planned_budget,
      },
    });

    return this.toSectionResponse(section);
  }

  /**
   * Updates section fields with two-level IDOR verification and trip bounds checks.
   */
  async updateSection(
    user: AuthenticatedUser,
    tripId: string,
    sectionId: string,
    dto: UpdateSectionDto,
    requestId: string,
  ): Promise<SectionResponse> {
    const section = await this.prisma.tripSection.findUnique({
      where: { id: sectionId },
      include: {
        trip: true,
        trip_stop: { include: { destination: true } },
        expenses: { select: { amount: true } },
      },
    });

    if (
      !section ||
      section.deleted_at !== null ||
      section.trip_id !== tripId ||
      section.trip.user_id !== user.id ||
      section.trip.deleted_at !== null
    ) {
      throw new NotFoundException('Trip section not found.');
    }

    if (dto.trip_stop_id !== undefined && dto.trip_stop_id !== null) {
      const stop = await this.prisma.tripStop.findUnique({
        where: { id: dto.trip_stop_id },
      });
      if (!stop || stop.trip_id !== tripId) {
        throw new BadRequestException('Linked trip stop does not belong to this trip.');
      }
    }

    const newStart = dto.start_date ? new Date(dto.start_date) : section.start_date;
    const newEnd = dto.end_date ? new Date(dto.end_date) : section.end_date;

    if (newEnd < newStart) {
      throw new BadRequestException('end_date must be greater than or equal to start_date.');
    }

    if (newStart < section.trip.start_date || newEnd > section.trip.end_date) {
      throw new BadRequestException('Section dates must fall within parent trip dates.');
    }

    const updated = await this.prisma.tripSection.update({
      where: { id: sectionId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        section_type: dto.section_type !== undefined ? dto.section_type : undefined,
        start_date: dto.start_date ? newStart : undefined,
        end_date: dto.end_date ? newEnd : undefined,
        planned_budget: dto.planned_budget !== undefined ? dto.planned_budget : undefined,
        currency: dto.currency !== undefined ? dto.currency : undefined,
        trip_stop_id: dto.trip_stop_id !== undefined ? dto.trip_stop_id : undefined,
        section_order: dto.section_order !== undefined ? dto.section_order : undefined,
      },
      include: {
        trip_stop: {
          include: { destination: true },
        },
        expenses: {
          select: { amount: true },
        },
      },
    });

    await this.audit.log({
      action: 'SECTION_UPDATED',
      actor_user_id: user.id,
      resource_type: 'trip_section',
      resource_id: sectionId,
      request_id: requestId,
      new_values: dto as any,
    });

    return this.toSectionResponse(updated);
  }

  /**
   * Soft-deletes a section, unlinks itinerary items, and re-normalizes section ordering.
   */
  async deleteSection(
    user: AuthenticatedUser,
    tripId: string,
    sectionId: string,
    requestId: string,
  ): Promise<{ message: string }> {
    const section = await this.prisma.tripSection.findUnique({
      where: { id: sectionId },
      include: { trip: true },
    });

    if (
      !section ||
      section.deleted_at !== null ||
      section.trip_id !== tripId ||
      section.trip.user_id !== user.id ||
      section.trip.deleted_at !== null
    ) {
      throw new NotFoundException('Trip section not found.');
    }

    await this.prisma.$transaction([
      this.prisma.tripSection.update({
        where: { id: sectionId },
        data: { deleted_at: new Date() },
      }),
      this.prisma.itineraryItem.updateMany({
        where: { trip_section_id: sectionId },
        data: { trip_section_id: null },
      }),
    ]);

    // Re-normalize ordering of remaining active sections
    const remainingSections = await this.prisma.tripSection.findMany({
      where: { trip_id: tripId, deleted_at: null },
      orderBy: { section_order: 'asc' },
    });

    for (let i = 0; i < remainingSections.length; i++) {
      if (remainingSections[i].section_order !== i + 1) {
        await this.prisma.tripSection.update({
          where: { id: remainingSections[i].id },
          data: { section_order: i + 1 },
        });
      }
    }

    await this.audit.log({
      action: 'SECTION_DELETED',
      actor_user_id: user.id,
      resource_type: 'trip_section',
      resource_id: sectionId,
      request_id: requestId,
    });

    return { message: 'Trip section deleted successfully' };
  }

  /**
   * Reorders sections in a trip with validation on active section membership.
   */
  async reorderSections(
    user: AuthenticatedUser,
    tripId: string,
    dto: ReorderSectionsDto,
    requestId: string,
  ): Promise<SectionResponse[]> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        sections: { where: { deleted_at: null } },
      },
    });

    if (!trip || trip.deleted_at !== null || trip.user_id !== user.id) {
      throw new NotFoundException('Trip not found.');
    }

    const existingSectionIds = new Set(trip.sections.map((s) => s.id));
    const uniqueIncomingIds = new Set(dto.section_ids);

    if (
      uniqueIncomingIds.size !== trip.sections.length ||
      dto.section_ids.length !== trip.sections.length ||
      !dto.section_ids.every((id) => existingSectionIds.has(id))
    ) {
      throw new BadRequestException(
        'Invalid section_ids provided. All active sections in the trip must be present exactly once.',
      );
    }

    // Atomic reorder updates in transaction
    await this.prisma.$transaction(
      dto.section_ids.map((id, index) =>
        this.prisma.tripSection.update({
          where: { id },
          data: { section_order: index + 1 },
        }),
      ),
    );

    await this.audit.log({
      action: 'SECTIONS_REORDERED',
      actor_user_id: user.id,
      resource_type: 'trip',
      resource_id: tripId,
      request_id: requestId,
      new_values: { section_ids_order: dto.section_ids },
    });

    const updatedSections = await this.prisma.tripSection.findMany({
      where: { trip_id: tripId, deleted_at: null },
      include: {
        trip_stop: {
          include: { destination: true },
        },
        expenses: {
          select: { amount: true },
        },
      },
      orderBy: { section_order: 'asc' },
    });

    return updatedSections.map((s) => this.toSectionResponse(s));
  }

  private toSectionResponse(section: any): SectionResponse {
    const actualSpent = (section.expenses || []).reduce(
      (sum: number, e: any) => sum + Number(e.amount),
      0,
    );

    return {
      id: section.id,
      trip_id: section.trip_id,
      trip_stop_id: section.trip_stop_id,
      title: section.title,
      description: section.description ?? null,
      section_type: section.section_type,
      start_date: section.start_date.toISOString().split('T')[0],
      end_date: section.end_date.toISOString().split('T')[0],
      planned_budget: section.planned_budget ? Number(section.planned_budget) : null,
      actual_spent: actualSpent,
      currency: section.currency,
      section_order: section.section_order,
      linked_stop: section.trip_stop
        ? {
            id: section.trip_stop.id,
            destination_name: section.trip_stop.destination?.name || 'Unknown',
            arrival_date: section.trip_stop.arrival_date.toISOString().split('T')[0],
            departure_date: section.trip_stop.departure_date.toISOString().split('T')[0],
          }
        : null,
      created_at: section.created_at,
      updated_at: section.updated_at,
    };
  }
}
