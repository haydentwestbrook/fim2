import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client'; // Import Role from Prisma client
import { CreateUserDto } from './dto/create-user.dto'; // Import CreateUserDto
import { UpdateUserDto } from './dto/update-user.dto'; // Import UpdateUserDto
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Finds a user by their ID.
   * @param id The ID of the user.
   * @returns The user object.
   * @throws NotFoundException if the user is not found.
   */
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Finds a user by their email address.
   * @param email The email address of the user.
   * @returns The user object if found, otherwise null.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Retrieves all users.
   * @returns A list of all user objects.
   */
  async findAll() {
    return this.prisma.user.findMany();
  }

  /**
   * Updates a user's information.
   * @param id The ID of the user to update.
   * @param data The data to update the user with.
   * @returns The updated user object.
   */
  async update(id: number, data: UpdateUserDto) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      },
    });
  }

  /**
   * Updates a user's role.
   * @param id The ID of the user to update.
   * @param data The data containing the new role.
   * @returns The updated user object.
   */
  async updateUserRole(id: number, data: UpdateUserRoleDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        role: data.role,
      },
    });
  }

  /**
   * Soft deletes a user by setting their isActive status to false.
   * @param id The ID of the user to soft delete.
   * @returns The updated user object.
   */
  async softDelete(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Creates a new user.
   * @param data The data for creating the user.
   * @returns The newly created user object.
   */
  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || Role.PLAYER,
      },
    });
  }
}
