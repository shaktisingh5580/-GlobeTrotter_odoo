import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AnalyticsEventParams {
  user_id?: string | null;
  event_type: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tracks user interaction events (searches, views, completions) for real-time admin trend analytics.
   */
  async track(params: AnalyticsEventParams): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          user_id: params.user_id || null,
          event_type: params.event_type,
          entity_type: params.entity_type || null,
          entity_id: params.entity_id || null,
          metadata: params.metadata ? (params.metadata as any) : undefined,
        },
      });
    } catch (error: any) {
      this.logger.warn(
        `Failed to record analytics event [${params.event_type}]: ${error.message}`,
      );
    }
  }
}
