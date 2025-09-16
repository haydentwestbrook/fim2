import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreateFoundryInstanceDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1024) // Example: Ports below 1024 are privileged
  @Max(65535)
  port: number;

  // ownerId can be added here if needed for creation
}