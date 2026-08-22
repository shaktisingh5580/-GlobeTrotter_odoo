import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('📦 Connected to PostgreSQL database via Prisma ORM');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('📦 Disconnected from PostgreSQL database');
  }

  /**
   * Executes a database operation within the context of an authenticated user.
   * Sets PostgreSQL session variable `app.current_user_id` to enforce RLS policies.
   */
  async executeWithUser<T>(
    userId: string,
    operation: (tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // Set the session-level user ID safely via parameterized query
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}::text, true)`;
      return operation(tx as any);
    });
  }

  /**
   * Executes a database operation in admin/system mode by clearing the RLS user context.
   */
  async executeAsAdmin<T>(
    operation: (tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
      return operation(tx as any);
    });
  }
}
