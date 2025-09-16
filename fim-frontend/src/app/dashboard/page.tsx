'use client';

import { signOut, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import api, { getHealthStatus } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
  error: any;
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
      setError("Failed to fetch health status.");
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
    return {}; // Ensure an empty object is returned if no token
  };

  const fetchFoundryInstances = async () => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      const response = await api.get<FoundryInstance[]>('/foundry', { headers });
      const data = response.data;
      setFoundryInstances(data);
    } catch (err: any) {
      setFoundryError(`Failed to fetch Foundry instances: ${err.message}`);
    } finally {
      setLoadingFoundry(false);
    }
  };

  const createFoundryInstance = async () => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      const response = await api.post('/foundry/create', { name: newInstanceName, port: parseInt(newInstancePort) }, { headers });
      setNewInstanceName('');
      setNewInstancePort('');
      fetchFoundryInstances(); // Refresh the list
    } catch (err: any) {
      setFoundryError(`Failed to create Foundry instance: ${err.message}`);
    } finally {
      setLoadingFoundry(false);
    }
  };

  const startFoundryInstance = async (instanceId: string) => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      const response = await api.post(`/foundry/${instanceId}/start`, {}, { headers });
      fetchFoundryInstances(); // Refresh the list
    } catch (err: any) {
      setFoundryError(`Failed to start Foundry instance: ${err.message}`);
    } finally {
      setLoadingFoundry(false);
    }
  };

  const stopFoundryInstance = async (instanceId: string) => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      const response = await api.post(`/foundry/${instanceId}/stop`, {}, { headers });
      fetchFoundryInstances(); // Refresh the list
    } catch (err: any) {
      setFoundryError(`Failed to stop Foundry instance: ${err.message}`);
    } finally {
      setLoadingFoundry(false);
    }
  };

  const deleteFoundryInstance = async (instanceId: string) => {
    setLoadingFoundry(true);
    setFoundryError(null);
    try {
      const headers = await getAuthHeader();
      const response = await api.delete(`/foundry/${instanceId}`, { headers });
      fetchFoundryInstances(); // Refresh the list
    } catch (err: any) {
      setFoundryError(`Failed to delete Foundry instance: ${err.message}`);
    } finally {
      setLoadingFoundry(false);
    }
  };
 
   useEffect(() => {
     fetchHealth();
     fetchFoundryInstances(); // Fetch Foundry instances on mount
   }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="mt-3 text-xl">Welcome! You are authenticated.</p>

      <Card className="mt-8 p-6 w-96">
        <h2 className="text-2xl font-semibold mb-4">System Health</h2>
        {loading && <LoadingSpinner />}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {health && (
          <div>
            <p className="text-lg">Overall Status: <span className={`font-bold ${health.status === 'ok' ? 'text-green-500' : 'text-red-500'}`}>{health.status.toUpperCase()}</span></p>
            <div className="mt-4">
              <h3 className="text-xl font-medium">Components:</h3>
              <ul className="list-disc list-inside">
                <li>
                  Database: <span className={`font-bold ${health.info.database.status === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {health.info.database.status.toUpperCase()}
                  </span>
                </li>
                <li>
                  Foundry: <span className={`font-bold ${health.info.foundry.status === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {health.info.foundry.status.toUpperCase()}
                  </span>
                </li>
              </ul>
            </div>
            <button
              onClick={fetchHealth}
              className="mt-4 px-4 py-2 font-bold text-white bg-gray-500 rounded hover:bg-gray-700"
            >
              Refresh Health
            </button>
          </div>
        )}
      </Card>

      <Card className="mt-8 p-6 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">Foundry Instance Management</h2>

        {loadingFoundry && <LoadingSpinner />}
        {foundryError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{foundryError}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Create New Instance</h3>
          <div className="flex space-x-4">
            <Input
              type="text"
              placeholder="Instance Name"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              className="flex-grow"
              disabled={loadingFoundry}
            />
            <Input
              type="number"
              placeholder="Port"
              value={newInstancePort}
              onChange={(e) => setNewInstancePort(e.target.value)}
              className="w-24"
              disabled={loadingFoundry}
            />
            <Button onClick={createFoundryInstance} disabled={loadingFoundry || !newInstanceName || !newInstancePort}>
              Create Instance
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-medium mb-2">Existing Instances</h3>
          {foundryInstances.length === 0 && !loadingFoundry && <p>No Foundry instances found.</p>}
          {foundryInstances.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Port</th>
                    <th className="py-2 px-4 border-b text-left">Status</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {foundryInstances.map((instance) => (
                    <tr key={instance.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{instance.name}</td>
                      <td className="py-2 px-4 border-b">{instance.port}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`font-bold ${instance.status === 'running' ? 'text-green-500' : instance.status === 'stopped' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {instance.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b space-x-2">
                        <Button
                          onClick={() => startFoundryInstance(instance.id)}
                          disabled={loadingFoundry || instance.status === 'running'}
                          className="bg-green-500 hover:bg-green-700 text-white"
                        >
                          Start
                        </Button>
                        <Button
                          onClick={() => stopFoundryInstance(instance.id)}
                          disabled={loadingFoundry || instance.status === 'stopped'}
                          className="bg-yellow-500 hover:bg-yellow-700 text-white"
                        >
                          Stop
                        </Button>
                        <Button
                          onClick={() => deleteFoundryInstance(instance.id)}
                          disabled={loadingFoundry}
                          className="bg-red-500 hover:bg-red-700 text-white"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
 
       <button
         onClick={() => signOut({ callbackUrl: "/login" })}
         className="mt-6 px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
       >
         Sign out
       </button>
     </div>
  );
}