import { ApiProperty } from '@nestjs/swagger';

export class FoundryInstanceResponseDto {
  @ApiProperty({ example: 'clsm00000000000000000000', description: 'The unique identifier of the Foundry VTT instance' })
  id: string;

  @ApiProperty({ example: 'MyAwesomeFoundry', description: 'The name of the Foundry VTT instance' })
  name: string;

  @ApiProperty({ example: 'RUNNING', enum: ['CREATING', 'RUNNING', 'STOPPED', 'ERROR', 'DELETING'], description: 'The current status of the Foundry VTT instance' })
  status: 'CREATING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DELETING';

  @ApiProperty({ example: 30000, description: 'The host port mapped to the Foundry VTT instance' })
  port: number;

  @ApiProperty({ example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', description: 'The Docker container ID (if running)', nullable: true })
  dockerContainerId: string | null;

  @ApiProperty({ example: 1, description: 'The ID of the user who owns this instance (optional)', nullable: true })
  ownerId: number | null;

  @ApiProperty({ example: '2023-01-01T12:00:00.000Z', description: 'The date and time when the instance was created' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T12:00:00.000Z', description: 'The date and time when the instance was last updated' })
  updatedAt: Date;

  @ApiProperty({ example: 'healthy', enum: ['healthy', 'unhealthy', 'unknown', 'checking'], description: 'The health status of the Foundry VTT instance' })
  healthStatus: 'healthy' | 'unhealthy' | 'unknown' | 'checking';
}