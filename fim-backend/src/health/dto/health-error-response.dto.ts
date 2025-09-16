import { ApiProperty } from '@nestjs/swagger';

class HealthIndicatorResultDto {
  @ApiProperty({ example: 'up', description: 'Status of the health indicator' })
  status: string;
}

class DatabaseHealthDto extends HealthIndicatorResultDto {}
class FoundryHealthDto extends HealthIndicatorResultDto {}

export class HealthErrorResponseDto {
  @ApiProperty({ type: () => DatabaseHealthDto, description: 'Database health status', nullable: true })
  database?: DatabaseHealthDto;

  @ApiProperty({ type: () => FoundryHealthDto, description: 'Foundry VTT health status', nullable: true })
  foundry?: FoundryHealthDto;
}