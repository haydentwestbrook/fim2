import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class FoundryService {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(FoundryService.name);
  }

  async startFoundry(): Promise<string> {
    this.logger.log('Attempting to start Foundry VTT Docker container...');
    try {
      const { stdout, stderr } = await execAsync('docker-compose up -d foundry');
      if (stderr) {
        this.logger.error(`Docker command stderr: ${stderr}`);
        throw new InternalServerErrorException('Failed to start Foundry VTT: Docker command error');
      }
      this.logger.log(`Foundry VTT started successfully: ${stdout}`);
      return 'Foundry VTT container is starting.';
    } catch (error) {
      this.logger.error(`Error starting Foundry VTT: ${error.message}`);
      throw new InternalServerErrorException(`Failed to start Foundry VTT: ${error.message}`);
    }
  }

  async stopFoundry(): Promise<string> {
    this.logger.log('Attempting to stop Foundry VTT Docker container...');
    try {
      const { stdout, stderr } = await execAsync('docker-compose stop foundry');
      if (stderr) {
        this.logger.error(`Docker command stderr: ${stderr}`);
        throw new InternalServerErrorException('Failed to stop Foundry VTT: Docker command error');
      }
      this.logger.log(`Foundry VTT stopped successfully: ${stdout}`);
      return 'Foundry VTT container is stopping.';
    } catch (error) {
      this.logger.error(`Error stopping Foundry VTT: ${error.message}`);
      throw new InternalServerErrorException(`Failed to stop Foundry VTT: ${error.message}`);
    }
  }

  async deleteFoundry(): Promise<string> {
    this.logger.log('Attempting to delete Foundry VTT Docker container and its volume...');
    try {
      const { stdout: stopStdout, stderr: stopStderr } = await execAsync('docker-compose rm -s -f -v foundry');
      if (stopStderr) {
        this.logger.error(`Docker delete command stderr: ${stopStderr}`);
        throw new InternalServerErrorException('Failed to delete Foundry VTT: Docker delete command error');
      }
      this.logger.log(`Foundry VTT deleted successfully: ${stopStdout}`);
      return 'Foundry VTT container and its volume are being deleted.';
    } catch (error) {
      this.logger.error(`Error deleting Foundry VTT: ${error.message}`);
      throw new InternalServerErrorException(`Failed to delete Foundry VTT: ${error.message}`);
    }
  }

  async getFoundryStatus(): Promise<string> {
    this.logger.log('Attempting to get Foundry VTT Docker container status...');
    try {
      const { stdout, stderr } = await execAsync('docker-compose ps -q foundry');
      if (stderr) {
        this.logger.error(`Docker command stderr: ${stderr}`);
        throw new InternalServerErrorException('Failed to get Foundry VTT status: Docker command error');
      }
      if (stdout.trim() === '') {
        return 'Foundry VTT container is not running.';
      }
      const { stdout: statusStdout } = await execAsync('docker inspect -f "{{.State.Status}}" ' + stdout.trim());
      this.logger.log(`Foundry VTT status: ${statusStdout.trim()}`);
      return `Foundry VTT container status: ${statusStdout.trim()}`;
    } catch (error) {
      this.logger.error(`Error getting Foundry VTT status: ${error.message}`);
      throw new InternalServerErrorException(`Failed to get Foundry VTT status: ${error.message}`);
    }
  }
}
