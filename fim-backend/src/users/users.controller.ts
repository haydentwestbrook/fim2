import { Controller, Get, UseGuards, Req, Put, Body, Delete, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client'; // Import Role from Prisma client
import type { Request } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger'; // Import ApiResponse and ApiOperation
import { UserResponseDto } from './dto/user-response.dto'; // Import UserResponseDto
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    role: Role;
  };
}

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users.', type: [UserResponseDto] })
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile data.', type: UserResponseDto })
  getProfile(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.findOne(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Updated user profile data.', type: UserResponseDto })
  updateProfile(@Req() req: AuthenticatedRequest, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a user role by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role successfully updated.', type: UserResponseDto })
  updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserRole(+id, updateUserRoleDto, req.user);
  }

  @Delete('profile')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, description: 'User account successfully deleted.' })
  deleteOwnAccount(@Req() req: AuthenticatedRequest): Promise<{ message: string }> {
    return this.usersService.softDelete(req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete a user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User successfully soft deleted.' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.usersService.softDelete(+id);
  }
}
