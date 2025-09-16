import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client'; // Import Role from Prisma client

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
  id: number;

  @ApiProperty({ example: 'john.doe@example.com', description: 'The email of the user' })
  email: string;

  @ApiProperty({ example: 'John', description: 'The first name of the user' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the user' })
  lastName: string;

  @ApiProperty({ example: true, description: 'Whether the user account is active' })
  isActive: boolean;

  @ApiProperty({ example: 'PLAYER', enum: Role, description: 'The role of the user' })
  role: Role;

  @ApiProperty({ example: '2023-01-01T12:00:00.000Z', description: 'The date and time when the user was created' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T12:00:00.000Z', description: 'The date and time when the user was last updated' })
  updatedAt: Date;
}