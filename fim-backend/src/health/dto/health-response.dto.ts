import { ApiProperty } from '@nestjs/swagger';
import { HealthInfoResponseDto } from './health-info-response.dto'; // Import HealthInfoResponseDto
import { HealthErrorResponseDto } from './health-error-response.dto'; // Import HealthErrorResponseDto

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Overall application health status' })
  status: string;

  @ApiProperty({ type: () => HealthInfoResponseDto, description: 'Detailed health information' })
  info: HealthInfoResponseDto;

  @ApiProperty({ type: () => HealthErrorResponseDto, description: 'Error details if status is "error"', nullable: true })
  error?: HealthErrorResponseDto;

  @ApiProperty({ type: () => HealthInfoResponseDto, description: 'Detailed health information (duplicate of info for backward compatibility)' })
  details: HealthInfoResponseDto;
}