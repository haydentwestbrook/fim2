import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Import Role from Prisma client

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);