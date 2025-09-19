'use client';

import { useEffect, useState, useCallback } from "react";
import api, { getHealthStatus } from "../../lib/api";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import SystemHealthCard from "../../components/dashboard/SystemHealthCard";
import FoundryInstanceManagement from "../../components/dashboard/FoundryInstanceManagement";
import useLogger from "../../lib/useLogger";
import DevModeIndicator from "../../components/dev/DevModeIndicator";

interface HealthStatus {
  status: string;
  info: {
    database: {
      status: string;
    };
    foundry: {
      status: string;
    };
  };
  error: Record<string, unknown> | null;
  details: {
    database: {
      status: string;
    };
    foundry: {
      status: string;
    };
  };
}

interface FoundryInstance {
  id: string;
  name: string;
  port: number;
  status: 'running' | 'stopped' | 'creating' | 'error';
}
 
export default function DashboardPage() {
  const log = useLogger({ component: 'DashboardPage' });
  
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [foundryInstances, setFoundryInstances] = useState<FoundryInstance[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstancePort, setNewInstancePort] = useState('');
  const [loadingFoundry, setLoadingFoundry] = useState(false);
  const [foundryError, setFoundryError] = useState<string | null>(null);
  
  const fetchHealth = useCallback(async () => {
    const startTime = performance.now();
    log.info('Starting health status fetch');
    setLoading(true);
    setError(null);
    try {
      const data = await getHealthStatus();
      setHealth(data);
      log.info('Health status fetched successfully', data);
    } catch (err) {
      const errorMessage = `Failed to fetch health status: ${err instanceof Error ? err.message : 'An unknown error occurred'}`;
      setError(errorMessage);
      setHealth(null);
      log.error('Health status fetch failed', { error: err, message: errorMessage });
    } finally {
      setLoading(false);
      const duration = performance.now() - startTime;
      log.performance('fetchHealth', duration);
    }
  }, [log]);

  const fetchFoundryInstances = useCallback(async () => {
    const startTime = performance.now();
    log.info('Starting Foundry instances fetch');
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      // Remove manual headers - let the optimized axios interceptor handle authentication
      const response = await api.get<FoundryInstance[]>('/foundry');
      const data = response.data;
      setFoundryInstances(data);
      log.info('Foundry instances fetched successfully', { count: data.length, instances: data });
    } catch (err) {
      const errorMessage = `Failed to fetch Foundry instances: ${err instanceof Error ? err.message : 'An unknown error occurred'}`;
      setFoundryError(errorMessage);
      log.error('Foundry instances fetch failed', { error: err, message: errorMessage });
    } finally {
      setLoadingFoundry(false);
      const duration = performance.now() - startTime;
      log.performance('fetchFoundryInstances', duration);
    }
  }, [log]);

  const createFoundryInstance = useCallback(async () => {
    const startTime = performance.now();
    const instanceData = { name: newInstanceName, port: parseInt(newInstancePort) };
    log.userAction('createFoundryInstance', instanceData);
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      // Remove manual headers - let the optimized axios interceptor handle authentication
      await api.post('/foundry/create', instanceData);
      setNewInstanceName('');
      setNewInstancePort('');
      log.info('Foundry instance created successfully', instanceData);
      // Refresh instances after creation
      fetchFoundryInstances();
    } catch (err) {
      const errorMessage = `Failed to create Foundry instance: ${err instanceof Error ? err.message : 'An unknown error occurred'}`;
      setFoundryError(errorMessage);
      log.error('Foundry instance creation failed', { error: err, message: errorMessage, instanceData });
    } finally {
      setLoadingFoundry(false);
      const duration = performance.now() - startTime;
      log.performance('createFoundryInstance', duration);
    }
  }, [newInstanceName, newInstancePort, log, fetchFoundryInstances]);

  const startFoundryInstance = useCallback(async (instanceId: string) => {
    const startTime = performance.now();
    log.userAction('startFoundryInstance', { instanceId });
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      // Remove manual headers - let the optimized axios interceptor handle authentication
      await api.post(`/foundry/${instanceId}/start`, {});
      log.info('Foundry instance started successfully', { instanceId });
      // Refresh instances after start
      fetchFoundryInstances();
    } catch (err) {
      const errorMessage = `Failed to start Foundry instance: ${err instanceof Error ? err.message : 'An unknown error occurred'}`;
      setFoundryError(errorMessage);
      log.error('Foundry instance start failed', { error: err, message: errorMessage, instanceId });
    } finally {
      setLoadingFoundry(false);
      const duration = performance.now() - startTime;
      log.performance('startFoundryInstance', duration);
    }
  }, [log, fetchFoundryInstances]);

  const stopFoundryInstance = useCallback(async (instanceId: string) => {
    const startTime = performance.now();
    log.userAction('stopFoundryInstance', { instanceId });
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      // Remove manual headers - let the optimized axios interceptor handle authentication
      await api.post(`/foundry/${instanceId}/stop`, {});
      log.info('Foundry instance stopped successfully', { instanceId });
      // Refresh instances after stop
      fetchFoundryInstances();
    } catch (err) {
      const errorMessage = `Failed to stop Foundry instance: ${err instanceof Error ? err.message : 'An unknown error occurred'}`;
      setFoundryError(errorMessage);
      log.error('Foundry instance stop failed', { error: err, message: errorMessage, instanceId });
    } finally {
      setLoadingFoundry(false);
      const duration = performance.now() - startTime;
      log.performance('stopFoundryInstance', duration);
    }
  }, [log, fetchFoundryInstances]);

  const deleteFoundryInstance = useCallback(async (instanceId: string) => {
    const startTime = performance.now();
    log.userAction('deleteFoundryInstance', { instanceId });
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      // Remove manual headers - let the optimized axios interceptor handle authentication
      await api.delete(`/foundry/${instanceId}`);
      log.info('Foundry instance deleted successfully', { instanceId });
      // Refresh instances after deletion
      fetchFoundryInstances();
    } catch (err) {
      const errorMessage = `Failed to delete Foundry instance: ${err instanceof Error ? err.message : 'An unknown error occurred'}`;
      setFoundryError(errorMessage);
      log.error('Foundry instance deletion failed', { error: err, message: errorMessage, instanceId });
    } finally {
      setLoadingFoundry(false);
      const duration = performance.now() - startTime;
      log.performance('deleteFoundryInstance', duration);
    }
  }, [log, fetchFoundryInstances]);
 
  useEffect(() => {
    log.info('Dashboard page initialized');
    
    // Initial data fetch
    fetchHealth();
    fetchFoundryInstances();

    // Set up health check interval (every 15 seconds)
    const healthInterval = parseInt(process.env.NEXT_PUBLIC_HEALTH_CHECK_INTERVAL || '15000', 10);
    const healthCheckInterval = setInterval(() => {
      log.info('Health check interval triggered');
      fetchHealth();
    }, healthInterval);
    
    // Set up Foundry instances refresh interval (every 30 seconds)
    const foundryInterval = 30000; // 30 seconds
    const foundryRefreshInterval = setInterval(() => {
      log.info('Foundry instances refresh interval triggered');
      fetchFoundryInstances();
    }, foundryInterval);
    
    log.info('Intervals started', { healthInterval, foundryInterval });

    return () => {
      clearInterval(healthCheckInterval);
      clearInterval(foundryRefreshInterval);
      log.info('Dashboard page cleanup - all intervals cleared');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  return (
    <>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Dashboard Header with Stats */}
          <DashboardHeader
            health={health}
            foundryInstances={foundryInstances}
            loading={loading}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* System Health - Takes 1 column on XL screens, full width on smaller */}
            <div className="xl:col-span-1">
              <SystemHealthCard
                health={health}
                loading={loading}
                error={error}
                onRefresh={fetchHealth}
              />
            </div>

            {/* Foundry Instance Management - Takes 2 columns on XL screens, full width on smaller */}
            <div className="xl:col-span-2">
              <FoundryInstanceManagement
                foundryInstances={foundryInstances}
                newInstanceName={newInstanceName}
                setNewInstanceName={setNewInstanceName}
                newInstancePort={newInstancePort}
                setNewInstancePort={setNewInstancePort}
                loadingFoundry={loadingFoundry}
                foundryError={foundryError}
                onCreateInstance={createFoundryInstance}
                onStartInstance={startFoundryInstance}
                onStopInstance={stopFoundryInstance}
                onDeleteInstance={deleteFoundryInstance}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
      <DevModeIndicator />
    </>
  );
}