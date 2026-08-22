import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogParams {
  action: string;
  actor_user_id?: string | null;
  resource_type: string;
  resource_id?: string | null;
  request_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an immutable audit log entry to the `audit_logs` table.
   * This is an append-only operation that operates safely across all feature modules.
   */
  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          actor_user_id: params.actor_user_id || null,
          resource_type: params.resource_type,
          resource_id: params.resource_id || null,
          request_id: params.request_id || null,
          ip_address: params.ip_address || null,
          user_agent: params.user_agent || null,
          old_values: params.old_values ? (params.old_values as any) : undefined,
          new_values: params.new_values ? (params.new_values as any) : undefined,
          metadata: params.metadata ? (params.metadata as any) : undefined,
        },
      });
    } catch (error: any) {
      // Never let audit log failure crash the primary business transaction, but log loudly
      this.logger.error(
        `Failed to record audit log [${params.action}] on [${params.resource_type}]: ${error.message}`,
        error.stack,
      );
    }
  }
}
