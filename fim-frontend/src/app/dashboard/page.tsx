'use client';

import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import api, { getHealthStatus } from "../../lib/api";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import SystemHealthCard from "../../components/dashboard/SystemHealthCard";
import FoundryInstanceManagement from "../../components/dashboard/FoundryInstanceManagement";

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
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [foundryInstances, setFoundryInstances] = useState<FoundryInstance[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstancePort, setNewInstancePort] = useState('');
  const [loadingFoundry, setLoadingFoundry] = useState(false);
  const [foundryError, setFoundryError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealthStatus();
      setHealth(data);
    } catch (err) {
      setError(`Failed to fetch health status: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const session = await getSession();
    if (session?.accessToken) {
      return { 'Authorization': `Bearer ${session.accessToken}` };
    }
    return {};
  };

  const fetchFoundryInstances = async () => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      const response = await api.get<FoundryInstance[]>('/foundry', { headers });
      const data = response.data;
      setFoundryInstances(data);
    } catch (err) {
      setFoundryError(`Failed to fetch Foundry instances: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setLoadingFoundry(false);
    }
  };

  const createFoundryInstance = async () => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      await api.post('/foundry/create', { name: newInstanceName, port: parseInt(newInstancePort) }, { headers });
      setNewInstanceName('');
      setNewInstancePort('');
      fetchFoundryInstances();
    } catch (err) {
      setFoundryError(`Failed to create Foundry instance: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setLoadingFoundry(false);
    }
  };

  const startFoundryInstance = async (instanceId: string) => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      await api.post(`/foundry/${instanceId}/start`, {}, { headers });
      fetchFoundryInstances();
    } catch (err) {
      setFoundryError(`Failed to start Foundry instance: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setLoadingFoundry(false);
    }
  };

  const stopFoundryInstance = async (instanceId: string) => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      await api.post(`/foundry/${instanceId}/stop`, {}, { headers });
      fetchFoundryInstances();
    } catch (err) {
      setFoundryError(`Failed to stop Foundry instance: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setLoadingFoundry(false);
    }
  };

  const deleteFoundryInstance = async (instanceId: string) => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      await api.delete(`/foundry/${instanceId}`, { headers });
      fetchFoundryInstances();
    } catch (err) {
      setFoundryError(`Failed to delete Foundry instance: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setLoadingFoundry(false);
    }
  };
 
  useEffect(() => {
    fetchHealth();
    fetchFoundryInstances();
  }, [fetchFoundryInstances]);

  return (
    <DashboardLayout>
      <SystemHealthCard
        health={health}
        loading={loading}
        error={error}
        onRefresh={fetchHealth}
      />
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
    </DashboardLayout>
  );
}