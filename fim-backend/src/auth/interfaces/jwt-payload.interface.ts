import { Role } from '@prisma/client';

export interface JwtPayload {
  email: string;
  sub: number; // User ID
  role: Role;
}