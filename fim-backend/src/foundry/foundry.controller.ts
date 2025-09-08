import { Controller, Post, UseGuards } from '@nestjs/common';
import { FoundryService } from './foundry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('foundry')
@Controller('foundry')
export class FoundryController {
  constructor(private readonly foundryService: FoundryService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Foundry VTT Docker container (Admin only)' })
  @ApiResponse({ status: 201, description: 'Foundry VTT container is starting.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async startFoundry(): Promise<string> {
    return this.foundryService.startFoundry();
  }

  @Post('stop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop Foundry VTT Docker container (Admin only)' })
  @ApiResponse({ status: 200, description: 'Foundry VTT container is stopping.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async stopFoundry(): Promise<string> {
    return this.foundryService.stopFoundry();
  }

  @Post('delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Foundry VTT Docker container and its volume (Admin only)' })
  @ApiResponse({ status: 200, description: 'Foundry VTT container and its volume are being deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteFoundry(): Promise<string> {
    return this.foundryService.deleteFoundry();
  }

  @Post('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Foundry VTT Docker container status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Foundry VTT container status.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getFoundryStatus(): Promise<string> {
    return this.foundryService.getFoundryStatus();
  }
}
