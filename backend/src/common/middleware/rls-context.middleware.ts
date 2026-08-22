import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RlsContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (user?.id) {
      try {
        await this.prisma.$executeRaw`SELECT set_config('app.current_user_id', ${user.id}::text, true)`;
      } catch (err) {
        // Silently proceed if connection isn't in transaction; service-level executeWithUser also enforces this
      }
    }
    next();
  }
}
