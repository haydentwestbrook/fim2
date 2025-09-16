import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HealthCheckService, HealthIndicatorFunction, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service'; // Import LoggerService
import { HealthResponseDto } from './dto/health-response.dto'; // Import HealthResponseDto

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    private readonly logger: LoggerService, // Inject LoggerService
  ) {
    this.logger.setContext(HealthService.name); // Set context for logger
  }

  async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      throw new InternalServerErrorException('Database connection failed');
    }
  }

  isFoundryHealthy(): HealthIndicatorFunction {
    return async () => {
      // For now, we'll mock the Foundry health check to always return 'up'.
      // In a real scenario, you would implement actual logic to check the Foundry container's status.
      return { foundry: { status: 'up' } };
    };
  }

  async getOverallHealth(): Promise<HealthResponseDto> {
    const databaseHealth = await this.checkDatabaseHealth();
    const foundryHealth = await this.isFoundryHealthy()(); // Execute the health indicator function

    const overallStatus = databaseHealth.status === 'up' && foundryHealth.foundry.status === 'up' ? 'ok' : 'error';

    const response: HealthResponseDto = {
      status: overallStatus,
      info: {
        database: { status: databaseHealth.status },
        foundry: { status: foundryHealth.foundry.status },
      },
      details: {
        database: { status: databaseHealth.status },
        foundry: { status: foundryHealth.foundry.status },
      },
    };

    if (overallStatus === 'error') {
      response.error = {
        database: databaseHealth.status === 'up' ? undefined : { status: databaseHealth.status },
        foundry: foundryHealth.foundry.status === 'up' ? undefined : { status: foundryHealth.foundry.status },
      };
    }

    return response;
  }
}
