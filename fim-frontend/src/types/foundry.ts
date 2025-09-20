export interface FoundryInstance {
  id: string;
  name: string;
  port: number;
  status: 'RUNNING' | 'STOPPED' | 'CREATING' | 'ERROR' | 'DELETING';
  healthStatus: 'healthy' | 'unhealthy' | 'unknown' | 'checking';
  dockerContainerId?: string | null;
  ownerId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}
