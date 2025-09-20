'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import api, { getHealthStatus } from "../../lib/api";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import SystemHealthCard from "../../components/dashboard/SystemHealthCard";
import FoundryInstanceManagement from "../../components/dashboard/FoundryInstanceManagement";
import useLogger from "../../lib/useLogger";
import DevModeIndicator from "../../components/dev/DevModeIndicator";
import { FoundryInstance } from "../../types/foundry";

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

 
export default function DashboardPage() {
  const log = useLogger({ component: 'DashboardPage' });
  const { data: session } = useSession();
  
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [foundryInstances, setFoundryInstances] = useState<FoundryInstance[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstancePort, setNewInstancePort] = useState('');
  const [loadingFoundry, setLoadingFoundry] = useState(false);
  const [foundryError, setFoundryError] = useState<string | null>(null);
  const [healthCheckingInstances, setHealthCheckingInstances] = useState<Set<string>>(new Set());
  
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
  }, []); // Remove log dependency to prevent recreation

  const checkInstanceHealth = useCallback(async (instanceId: string) => {
    log.info('Starting health check for instance', { instanceId });
    setHealthCheckingInstances(prev => new Set(prev).add(instanceId));
    
    try {
      const response = await api.get<FoundryInstance[]>('/foundry');
      const data = response.data;
      const updatedInstance = data.find(instance => instance.id === instanceId);
      
      if (updatedInstance) {
        setFoundryInstances(prev => 
          prev.map(instance => 
            instance.id === instanceId 
              ? { ...instance, healthStatus: updatedInstance.healthStatus }
              : instance
          )
        );
        log.info('Health check completed for instance', { instanceId, healthStatus: updatedInstance.healthStatus });
      }
    } catch (err) {
      log.error('Health check failed for instance', { instanceId, error: err });
      // Set health status to unknown on error
      setFoundryInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? { ...instance, healthStatus: 'unknown' as const }
            : instance
        )
      );
    } finally {
      setHealthCheckingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceId);
        return newSet;
      });
    }
  }, []); // Remove log dependency

  const fetchFoundryInstances = useCallback(async () => {
    // Only fetch Foundry instances for admin users
    if (session?.user?.role !== 'ADMIN') {
      log.info('Skipping Foundry instances fetch - user is not admin');
      return;
    }

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
  }, [session]); // Only depend on session, not log

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
    if (session) {
      fetchFoundryInstances();
    }

    // Set up system health check interval (every 30 seconds)
    const systemHealthInterval = parseInt(process.env.NEXT_PUBLIC_HEALTH_CHECK_INTERVAL || '30000', 10);
    const systemHealthCheckInterval = setInterval(() => {
      log.info('System health check interval triggered');
      fetchHealth();
    }, systemHealthInterval);
    
    // Set up Foundry instances refresh interval (every 30 seconds)
    const foundryInterval = 30000; // 30 seconds
    const foundryRefreshInterval = setInterval(() => {
      log.info('Foundry instances refresh interval triggered');
      fetchFoundryInstances();
    }, foundryInterval);

    // Set up instance health check interval (configurable via environment variable)
    const instanceHealthCheckInterval = parseInt(process.env.NEXT_PUBLIC_INSTANCE_HEALTH_CHECK_INTERVAL || '60000', 10); // Default 60 seconds
    const instanceHealthCheckRefreshInterval = setInterval(() => {
      log.info('Instance health check interval triggered');
      // Check health for all running instances
      foundryInstances.forEach(instance => {
        if (instance.status === 'RUNNING' && !healthCheckingInstances.has(instance.id)) {
          checkInstanceHealth(instance.id);
        }
      });
    }, instanceHealthCheckInterval);
    
    log.info('Intervals started', { systemHealthInterval, foundryInterval, instanceHealthCheckInterval });

    return () => {
      clearInterval(systemHealthCheckInterval);
      clearInterval(foundryRefreshInterval);
      clearInterval(instanceHealthCheckRefreshInterval);
      log.info('Dashboard page cleanup - all intervals cleared');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]); // Only depend on session, not the functions

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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* System Health - Takes 1 column on LG screens, full width on smaller */}
            <div className="lg:col-span-1">
              <SystemHealthCard
                health={health}
                loading={loading}
                error={error}
                onRefresh={fetchHealth}
              />
            </div>

            {/* Foundry Instance Management - Only show for admin users */}
            {session?.user?.role === 'ADMIN' && (
              <div className="lg:col-span-3">
                <FoundryInstanceManagement
                  foundryInstances={foundryInstances}
                  newInstanceName={newInstanceName}
                  setNewInstanceName={setNewInstanceName}
                  newInstancePort={newInstancePort}
                  setNewInstancePort={setNewInstancePort}
                  loadingFoundry={loadingFoundry}
                  foundryError={foundryError}
                  healthCheckingInstances={healthCheckingInstances}
                  onCreateInstance={createFoundryInstance}
                  onStartInstance={startFoundryInstance}
                  onStopInstance={stopFoundryInstance}
                  onDeleteInstance={deleteFoundryInstance}
                  onCheckHealth={checkInstanceHealth}
                />
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
      <DevModeIndicator />
    </>
  );
}