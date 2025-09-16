import { Controller, Post, UseGuards, Param, Body, Get, Delete } from '@nestjs/common';
import { CreateFoundryInstanceDto } from './dto/create-foundry-instance.dto';
import { FoundryService } from './foundry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client'; // Import Role from Prisma client
import { ApiBearerAuth, ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { FoundryInstanceResponseDto } from './dto/foundry-instance-response.dto'; // Import FoundryInstanceResponseDto
import { FoundryInstanceStatusResponseDto } from './dto/foundry-instance-status-response.dto'; // Import FoundryInstanceStatusResponseDto

@ApiTags('foundry')
@Controller('foundry')
export class FoundryController {
  constructor(private readonly foundryService: FoundryService) {}

  @Post(':instanceId/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Foundry VTT Docker container (Admin only)' })
  @ApiResponse({ status: 201, description: 'Foundry VTT container is starting.', type: FoundryInstanceResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async startFoundry(@Param('instanceId') instanceId: string): Promise<FoundryInstanceResponseDto> {
    return this.foundryService.startFoundry(instanceId);
  }

  @Post(':instanceId/stop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop Foundry VTT Docker container (Admin only)' })
  @ApiResponse({ status: 200, description: 'Foundry VTT container is stopping.', type: FoundryInstanceResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async stopFoundry(@Param('instanceId') instanceId: string): Promise<FoundryInstanceResponseDto> {
    return this.foundryService.stopFoundry(instanceId);
  }

  @Delete(':instanceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Foundry VTT Docker container and its volume (Admin only)' })
  @ApiResponse({ status: 200, description: 'Foundry VTT instance successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteFoundry(@Param('instanceId') instanceId: string): Promise<void> {
    return this.foundryService.deleteFoundry(instanceId);
  }

  @Get(':instanceId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Foundry VTT Docker container status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Foundry VTT container status.', type: FoundryInstanceStatusResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getFoundryStatus(@Param('instanceId') instanceId: string): Promise<FoundryInstanceStatusResponseDto> {
    const status = await this.foundryService.getFoundryStatus(instanceId);
    return { status };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Foundry VTT instance (Admin only)' })
  @ApiResponse({ status: 201, description: 'Foundry VTT instance created.', type: FoundryInstanceResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createFoundryInstance(@Body() createFoundryInstanceDto: CreateFoundryInstanceDto): Promise<FoundryInstanceResponseDto> {
    const { name, port } = createFoundryInstanceDto;
    // ownerId can be optional for now, or retrieved from the request if authentication is set up for it
    return this.foundryService.createFoundryInstance(name, port);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all Foundry VTT instances (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of Foundry VTT instances.', type: [FoundryInstanceResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async listFoundryInstances(): Promise<FoundryInstanceResponseDto[]> {
    return this.foundryService.listFoundryInstances();
  }
}
