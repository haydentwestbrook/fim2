import { Controller, Get, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger'; // Import ApiOperation
import { LoggerService } from '../common/logger/logger.service'; // Import LoggerService
import { HealthResponseDto } from './dto/health-response.dto'; // Import HealthResponseDto
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly logger: LoggerService, // Inject LoggerService
  ) {
    this.logger.setContext(HealthController.name); // Set context for logger
  }

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application health status', type: HealthResponseDto })
  async getHealth(): Promise<HealthResponseDto> {
    this.logger.log('getHealth method hit');
    return this.healthService.getOverallHealth();
  }
}
