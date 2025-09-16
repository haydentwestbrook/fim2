import React from 'react';
import { Card } from "../ui/Card";
import { Alert, AlertTitle, AlertDescription } from "../ui/Alert";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface FoundryInstance {
  id: string;
  name: string;
  port: number;
  status: 'running' | 'stopped' | 'creating' | 'error';
}

interface FoundryInstanceManagementProps {
  foundryInstances: FoundryInstance[];
  newInstanceName: string;
  setNewInstanceName: (name: string) => void;
  newInstancePort: string;
  setNewInstancePort: (port: string) => void;
  loadingFoundry: boolean;
  foundryError: string | null;
  onCreateInstance: () => void;
  onStartInstance: (instanceId: string) => void;
  onStopInstance: (instanceId: string) => void;
  onDeleteInstance: (instanceId: string) => void;
}

export default function FoundryInstanceManagement({
  foundryInstances,
  newInstanceName,
  setNewInstanceName,
  newInstancePort,
  setNewInstancePort,
  loadingFoundry,
  foundryError,
  onCreateInstance,
  onStartInstance,
  onStopInstance,
  onDeleteInstance,
}: FoundryInstanceManagementProps) {
  return (
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
          <Button onClick={onCreateInstance} disabled={loadingFoundry || !newInstanceName || !newInstancePort}>
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
                        onClick={() => onStartInstance(instance.id)}
                        disabled={loadingFoundry || instance.status === 'running'}
                        className="bg-green-500 hover:bg-green-700 text-white"
                      >
                        Start
                      </Button>
                      <Button
                        onClick={() => onStopInstance(instance.id)}
                        disabled={loadingFoundry || instance.status === 'stopped'}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white"
                      >
                        Stop
                      </Button>
                      <Button
                        onClick={() => onDeleteInstance(instance.id)}
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
  );
}