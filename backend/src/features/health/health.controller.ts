import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(@RequestId() requestId: string) {
    // Verify database connectivity
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'GlobeTrotter Backend API',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
