import { ApiProperty } from '@nestjs/swagger';

export class FoundryInstanceStatusResponseDto {
  @ApiProperty({ example: 'RUNNING', enum: ['CREATING', 'RUNNING', 'STOPPED', 'ERROR', 'DELETING'], description: 'The current status of the Foundry VTT instance' })
  status: 'CREATING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DELETING';
}