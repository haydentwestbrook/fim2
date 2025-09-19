import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises'; // Import fs/promises
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
  async startFoundry(instanceId: string): Promise<FoundryInstance & { healthStatus: 'healthy' | 'unhealthy' | 'unknown' | 'checking' }> {
    this.logger.log(`Attempting to start Foundry VTT instance with ID: ${instanceId}`);

    let instance = await this.prisma.foundryInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new NotFoundException(`Foundry instance with ID ${instanceId} not found.`);
    }

    if (instance.status === FoundryInstanceStatus.RUNNING) {
      throw new BadRequestException(`Foundry instance ${instance.name} is already running.`);
    }

    try {
      let dockerContainerId = instance.dockerContainerId;

      // If the container already exists, just start it.
      if (dockerContainerId) {
        this.logger.log(`Foundry instance ${instance.name} already has a container. Starting it now.`);
        const dockerStartCommand = `docker start ${dockerContainerId}`;
        await this._executeCommand(dockerStartCommand, `Failed to start existing Docker container for instance ${instance.name}`);
      } else {
        this.logger.log(`Foundry instance ${instance.name} does not have a container. Creating and starting a new one.`);
        // Path to the data root *inside* the backend container, as mounted by docker-compose.
        const internalDataRoot = '/app/foundry-data-root';
        const internalInstancePath = `${internalDataRoot}/${instance.id}`;

        // Path to the data root *on the host*, read from environment variables.
        const hostDataRoot = process.env.FIM_FOUNDRY_DATA_ROOT || '/var/lib/foundryvtt/data';
        const hostInstancePath = `${hostDataRoot}/${instance.id}`;

        // Create the directory on the path inside the container, which maps to the host.
        await fs.mkdir(internalInstancePath, { recursive: true });
        this.logger.debug(`Ensured host data directory exists at: ${internalInstancePath}`);

        // Change ownership of the directory to the foundry user (1000:1000)
        const chownCommand = `chown -R 1000:1000 ${internalInstancePath}`;
        await this._executeCommand(chownCommand, `Failed to change ownership of ${internalInstancePath}`);
        this.logger.debug(`Changed ownership of ${internalInstancePath} to 1000:1000`);

        // Use the *host path* for the Docker volume mount command, as the Docker daemon needs it.
        // The felddy/foundryvtt container will use these environment variables to set the correct permissions on the /data volume.
        const dockerRunCommand = `docker run -d --name foundry-${instance.name} -p ${instance.port}:30000 --user 1000:1000 -e FOUNDRY_USERNAME=${process.env.FOUNDRY_USERNAME} -e FOUNDRY_PASSWORD=${process.env.FOUNDRY_PASSWORD} -v ${hostInstancePath}:/data felddy/foundryvtt:latest`;
        dockerContainerId = await this._executeCommand(
          dockerRunCommand,
          `Failed to start Docker container for instance ${instance.name}`,
        );
      }

      instance = await this.prisma.foundryInstance.update({
        where: { id: instanceId },
        data: {
          dockerContainerId: dockerContainerId,
          status: FoundryInstanceStatus.RUNNING,
        },
      });

      this.logger.log(`Foundry VTT instance ${instance.name} started successfully. Container ID: ${dockerContainerId}`);
      
      // Check health status for the started instance
      const healthStatus = await this.checkInstanceHealth(instance);
      return { ...instance, healthStatus };
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
  async stopFoundry(instanceId: string): Promise<FoundryInstance & { healthStatus: 'healthy' | 'unhealthy' | 'unknown' | 'checking' }> {
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
      
      // For stopped instances, health status is always unknown
      return { ...instance, healthStatus: 'unknown' as const };
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
  async createFoundryInstance(name: string, port: number, ownerId?: number): Promise<FoundryInstance & { healthStatus: 'healthy' | 'unhealthy' | 'unknown' | 'checking' }> {
    this.logger.log(`Attempting to create Foundry VTT instance with name: ${name}, port: ${port}`);

    const existingInstanceByName = await this.prisma.foundryInstance.findUnique({ where: { name } });
    if (existingInstanceByName) {
      throw new BadRequestException(`Foundry instance with name '${name}' already exists.`);
    }

    const existingInstanceByPort = await this.prisma.foundryInstance.findUnique({ where: { port } });
    if (existingInstanceByPort) {
      throw new BadRequestException(`Foundry instance with port '${port}' already in use.`);
    }

    const newInstance = await this.prisma.foundryInstance.create({
      data: {
        name,
        port,
        ownerId,
        status: FoundryInstanceStatus.CREATING,
      },
    });
    this.logger.log(`Foundry VTT instance ${name} database record created with ID: ${newInstance.id}`);

    try {
      const startedInstance = await this.startFoundry(newInstance.id);
      this.logger.log(`Foundry VTT instance ${name} container started successfully.`);
      return startedInstance;
    } catch (error) {
      this.logger.error(`Failed to start container for instance ${name}. Deleting database record to prevent orphaned entry.`);
      await this.prisma.foundryInstance.delete({ where: { id: newInstance.id } });
      this.logger.log(`Deleted database record for instance ${name}.`);
      throw error; // Re-throw the original error from startFoundry
    }
  }
  /**
   * Checks the health of a Foundry VTT instance by making an HTTP request to its port.
   * @param instance The Foundry instance to check
   * @returns The health status of the instance
   */
  private async checkInstanceHealth(instance: FoundryInstance): Promise<'healthy' | 'unhealthy' | 'unknown'> {
    try {
      // Only check health for running instances
      if (instance.status !== 'RUNNING') {
        return 'unknown';
      }

      const axios = require('axios');
      const response = await axios.get(`http://localhost:${instance.port}`, {
        timeout: 5000, // 5 second timeout
        validateStatus: (status) => status < 500, // Accept any status < 500 as healthy
      });
      
      // If we get any response (even 404), the service is running
      return 'healthy';
    } catch (error) {
      this.logger.debug(`Health check failed for instance ${instance.name}: ${error.message}`);
      return 'unhealthy';
    }
  }

  /**
   * Lists all Foundry VTT instances with their health status.
   * @returns A list of all Foundry VTT instances with health status.
   */
  async listFoundryInstances(): Promise<(FoundryInstance & { healthStatus: 'healthy' | 'unhealthy' | 'unknown' | 'checking' })[]> {
    this.logger.log('Attempting to list all Foundry VTT instances.');
    try {
      const instances = await this.prisma.foundryInstance.findMany();
      this.logger.log(`Found ${instances.length} Foundry VTT instances.`);
      
      // Check health for all instances in parallel
      const instancesWithHealth = await Promise.all(
        instances.map(async (instance) => {
          const healthStatus = await this.checkInstanceHealth(instance);
          return {
            ...instance,
            healthStatus,
          };
        })
      );
      
      return instancesWithHealth;
    } catch (error) {
      this.logger.error(`Error listing Foundry VTT instances: ${error.message}`);
      throw error;
    }
  }
}
