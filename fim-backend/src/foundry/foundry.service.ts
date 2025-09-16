import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FoundryInstance, FoundryInstanceStatus } from '@prisma/client'; // Import Prisma namespace, FoundryInstance model type, and FoundryInstanceStatus enum

const execAsync = promisify(exec);

@Injectable()
export class FoundryService {
  constructor(private readonly logger: LoggerService, private readonly prisma: PrismaService) {
    this.logger.setContext(FoundryService.name);
  }

  private async _executeCommand(command: string, errorMessage: string): Promise<string> {
    try {
      this.logger.debug(`Executing command: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      if (stderr) {
        this.logger.error(`Command stderr: ${stderr}`);
        throw new InternalServerErrorException(`${errorMessage}: ${stderr}`);
      }
      return stdout.trim();
    } catch (error) {
      this.logger.error(`${errorMessage}: ${error.message}`);
      throw new InternalServerErrorException(`${errorMessage}: ${error.message}`);
    }
  }

  /**
   * Starts a Foundry VTT instance.
   * @param instanceId The ID of the Foundry VTT instance to start.
   * @returns The updated Foundry VTT instance.
   * @throws NotFoundException if the instance is not found.
   * @throws BadRequestException if the instance is already running or creating.
   * @throws InternalServerErrorException if Docker command fails.
   */
  async startFoundry(instanceId: string): Promise<FoundryInstance> {
    this.logger.log(`Attempting to start Foundry VTT instance with ID: ${instanceId}`);

    let instance = await this.prisma.foundryInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new NotFoundException(`Foundry instance with ID ${instanceId} not found.`);
    }

    if (instance.status === FoundryInstanceStatus.RUNNING || instance.status === FoundryInstanceStatus.CREATING) {
      throw new BadRequestException(`Foundry instance ${instance.name} is already running or in a creating state.`);
    }

    try {
      const dockerRunCommand = `docker run -d --name foundry-${instance.name} -p ${instance.port}:3000 foundryvtt/foundryvtt:latest`;
      const dockerContainerId = await this._executeCommand(dockerRunCommand, `Failed to start Docker container for instance ${instance.name}`);

      instance = await this.prisma.foundryInstance.update({
        where: { id: instanceId },
        data: {
          dockerContainerId: dockerContainerId,
          status: FoundryInstanceStatus.RUNNING,
        },
      });

      this.logger.log(`Foundry VTT instance ${instance.name} started successfully. Container ID: ${dockerContainerId}`);
      return instance;
    } catch (error) {
      this.logger.error(`Error starting Foundry VTT instance ${instance.name}: ${error.message}`);
      throw error; // Re-throw the exception from _executeCommand or Prisma
    }
  }

  /**
   * Stops a Foundry VTT instance.
   * @param instanceId The ID of the Foundry VTT instance to stop.
   * @returns The updated Foundry VTT instance.
   * @throws NotFoundException if the instance is not found.
   * @throws BadRequestException if the instance is not running.
   * @throws InternalServerErrorException if Docker command fails or no container ID is associated.
   */
  async stopFoundry(instanceId: string): Promise<FoundryInstance> {
    this.logger.log(`Attempting to stop Foundry VTT instance with ID: ${instanceId}`);

    let instance = await this.prisma.foundryInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new NotFoundException(`Foundry instance with ID ${instanceId} not found.`);
    }

    if (instance.status !== FoundryInstanceStatus.RUNNING) {
      throw new BadRequestException(`Foundry instance ${instance.name} is not running.`);
    }

    if (!instance.dockerContainerId) {
      throw new InternalServerErrorException(`Foundry instance ${instance.name} has no associated Docker container ID.`);
    }

    try {
      const dockerStopCommand = `docker stop ${instance.dockerContainerId}`;
      await this._executeCommand(dockerStopCommand, `Failed to stop Docker container for instance ${instance.name}`);

      instance = await this.prisma.foundryInstance.update({
        where: { id: instanceId },
        data: {
          status: FoundryInstanceStatus.STOPPED,
        },
      });

      this.logger.log(`Foundry VTT instance ${instance.name} stopped successfully.`);
      return instance;
    } catch (error) {
      this.logger.error(`Error stopping Foundry VTT instance ${instance.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a Foundry VTT instance and its associated Docker container.
   * @param instanceId The ID of the Foundry VTT instance to delete.
   * @throws NotFoundException if the instance is not found.
   * @throws InternalServerErrorException if Docker command fails.
   */
  async deleteFoundry(instanceId: string): Promise<void> {
    this.logger.log(`Attempting to delete Foundry VTT instance with ID: ${instanceId}`);

    const instance = await this.prisma.foundryInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new NotFoundException(`Foundry instance with ID ${instanceId} not found.`);
    }

    try {
      if (instance.dockerContainerId) {
        const dockerRmCommand = `docker rm -f ${instance.dockerContainerId}`;
        await this._executeCommand(dockerRmCommand, `Failed to remove Docker container for instance ${instance.name}`);
      }

      await this.prisma.foundryInstance.delete({ where: { id: instanceId } });

      this.logger.log(`Foundry VTT instance ${instance.name} and its Docker container (if existed) deleted successfully.`);
    } catch (error) {
      this.logger.error(`Error deleting Foundry VTT instance ${instance.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the current status of a Foundry VTT instance.
   * @param instanceId The ID of the Foundry VTT instance.
   * @returns The current status of the instance.
   * @throws NotFoundException if the instance is not found.
   * @throws InternalServerErrorException if Docker command fails.
   */
  async getFoundryStatus(instanceId: string): Promise<FoundryInstanceStatus> {
    this.logger.log(`Attempting to get Foundry VTT instance status for ID: ${instanceId}`);

    let instance = await this.prisma.foundryInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new NotFoundException(`Foundry instance with ID ${instanceId} not found.`);
    }

    if (!instance.dockerContainerId) {
      this.logger.log(`Instance ${instance.name} has no Docker container ID. Assuming ${FoundryInstanceStatus.STOPPED} status.`);
      if (instance.status !== FoundryInstanceStatus.STOPPED) {
        await this.prisma.foundryInstance.update({
          where: { id: instanceId },
          data: { status: FoundryInstanceStatus.STOPPED },
        });
      }
      return FoundryInstanceStatus.STOPPED;
    }

    try {
      const dockerInspectCommand = `docker inspect --format='{{.State.Status}}' ${instance.dockerContainerId}`;
      const dockerStatus = await this._executeCommand(dockerInspectCommand, `Failed to inspect Docker container for instance ${instance.name}`);

      let currentStatus: FoundryInstanceStatus;
      switch (dockerStatus.toLowerCase()) {
        case 'running':
          currentStatus = FoundryInstanceStatus.RUNNING;
          break;
        case 'exited':
          currentStatus = FoundryInstanceStatus.STOPPED;
          break;
        default:
          currentStatus = FoundryInstanceStatus.ERROR;
          this.logger.warn(`Unknown Docker status for instance ${instance.name}: ${dockerStatus}`);
      }

      if (instance.status !== currentStatus) {
        this.logger.log(`Updating database status for instance ${instance.name} from ${instance.status} to ${currentStatus}`);
        await this.prisma.foundryInstance.update({
          where: { id: instanceId },
          data: { status: currentStatus },
        });
      }

      this.logger.log(`Foundry VTT instance ${instance.name} status: ${currentStatus}`);
      return currentStatus;
    } catch (error) {
      this.logger.error(`Error getting Foundry VTT status for instance ${instance.name}: ${error.message}`);
      // If docker inspect fails, it might mean the container is gone or in a bad state.
      // Consider updating DB status to ERROR or STOPPED if appropriate.
      if (instance.status !== FoundryInstanceStatus.ERROR) {
        await this.prisma.foundryInstance.update({
          where: { id: instanceId },
          data: { status: FoundryInstanceStatus.ERROR },
        });
      }
      throw error;
    }
  }
  /**
   * Creates a new Foundry VTT instance.
   * @param name The name of the new instance.
   * @param port The port for the new instance.
   * @param ownerId Optional ID of the user who owns the instance.
   * @returns The newly created Foundry VTT instance.
   * @throws BadRequestException if an instance with the same name or port already exists.
   */
  async createFoundryInstance(name: string, port: number, ownerId?: number): Promise<FoundryInstance> {
    this.logger.log(`Attempting to create Foundry VTT instance with name: ${name}, port: ${port}`);

    const existingInstanceByName = await this.prisma.foundryInstance.findUnique({ where: { name } });
    if (existingInstanceByName) {
      throw new BadRequestException(`Foundry instance with name '${name}' already exists.`);
    }

    const existingInstanceByPort = await this.prisma.foundryInstance.findUnique({ where: { port } });
    if (existingInstanceByPort) {
      throw new BadRequestException(`Foundry instance with port '${port}' already in use.`);
    }

    try {
      const newInstance = await this.prisma.foundryInstance.create({
        data: {
          name,
          port,
          ownerId,
          status: FoundryInstanceStatus.CREATING,
        },
      });

      this.logger.log(`Foundry VTT instance ${name} created successfully with ID: ${newInstance.id}`);
      return newInstance;
    } catch (error) {
      this.logger.error(`Error creating Foundry VTT instance ${name}: ${error.message}`);
      throw error;
    }
  }
  /**
   * Lists all Foundry VTT instances.
   * @returns A list of all Foundry VTT instances.
   */
  async listFoundryInstances(): Promise<FoundryInstance[]> {
    this.logger.log('Attempting to list all Foundry VTT instances.');
    try {
      const instances = await this.prisma.foundryInstance.findMany();
      this.logger.log(`Found ${instances.length} Foundry VTT instances.`);
      return instances;
    } catch (error) {
      this.logger.error(`Error listing Foundry VTT instances: ${error.message}`);
      throw error;
    }
  }
}
