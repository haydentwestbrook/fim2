import React, { memo } from 'react';
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
  healthStatus: 'healthy' | 'unhealthy' | 'unknown' | 'checking';
}

interface FoundryInstanceManagementProps {
  foundryInstances: FoundryInstance[];
  newInstanceName: string;
  setNewInstanceName: (name: string) => void;
  newInstancePort: string;
  setNewInstancePort: (port: string) => void;
  loadingFoundry: boolean;
  foundryError: string | null;
  healthCheckingInstances: Set<string>;
  onCreateInstance: () => void;
  onStartInstance: (instanceId: string) => void;
  onStopInstance: (instanceId: string) => void;
  onDeleteInstance: (instanceId: string) => void;
  onCheckHealth: (instanceId: string) => void;
}

const FoundryInstanceManagement = memo(function FoundryInstanceManagement({
  foundryInstances,
  newInstanceName,
  setNewInstanceName,
  newInstancePort,
  setNewInstancePort,
  loadingFoundry,
  foundryError,
  healthCheckingInstances,
  onCreateInstance,
  onStartInstance,
  onStopInstance,
  onDeleteInstance,
  onCheckHealth,
}: FoundryInstanceManagementProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'stopped':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'creating':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '●';
      case 'stopped':
        return '○';
      case 'creating':
        return '⟳';
      case 'error':
        return '✗';
      default:
        return '?';
    }
  };

  const getHealthStatusColor = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unknown':
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthStatusIcon = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy':
        return '✓';
      case 'unhealthy':
        return '✗';
      case 'checking':
        return '⟳';
      case 'unknown':
      default:
        return '?';
    }
  };

  const getCombinedStatusDisplay = (instance: FoundryInstance) => {
    const statusText = instance.status.toUpperCase();
    const healthText = instance.healthStatus.toUpperCase();
    const isChecking = healthCheckingInstances.has(instance.id);
    
    if (instance.status === 'running') {
      return `${statusText} (${isChecking ? 'CHECKING...' : healthText})`;
    }
    return statusText;
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Foundry Instances</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your Foundry VTT instances</p>
        </div>
        <div className="text-sm text-gray-500">
          {foundryInstances.length} instance{foundryInstances.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loadingFoundry && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {foundryError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{foundryError}</AlertDescription>
        </Alert>
      )}

      {/* Create New Instance Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Instance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instance Name</label>
            <Input
              type="text"
              placeholder="Enter instance name"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              disabled={loadingFoundry}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <Input
              type="number"
              placeholder="30000"
              value={newInstancePort}
              onChange={(e) => setNewInstancePort(e.target.value)}
              disabled={loadingFoundry}
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button 
            onClick={onCreateInstance} 
            disabled={loadingFoundry || !newInstanceName || !newInstancePort}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            {loadingFoundry ? 'Creating...' : 'Create Instance'}
          </Button>
        </div>
      </div>

      {/* Existing Instances Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Instances</h3>
        
        {foundryInstances.length === 0 && !loadingFoundry && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 text-4xl mb-4">🎲</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No instances found</h4>
            <p className="text-gray-600">Create your first Foundry instance to get started</p>
          </div>
        )}

        {foundryInstances.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Port
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {foundryInstances.map((instance) => (
                    <tr key={instance.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{instance.name}</div>
                        <div className="text-sm text-gray-500">ID: {instance.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {instance.port}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(instance.status)}`}>
                            <span className="mr-1">{getStatusIcon(instance.status)}</span>
                            {getCombinedStatusDisplay(instance)}
                          </span>
                          {instance.status === 'running' && (
                            <Button
                              onClick={() => onCheckHealth(instance.id)}
                              disabled={healthCheckingInstances.has(instance.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs rounded-md transition-colors"
                              title="Check Health"
                            >
                              {healthCheckingInstances.has(instance.id) ? '⟳' : '↻'}
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          onClick={() => onStartInstance(instance.id)}
                          disabled={loadingFoundry || instance.status === 'running'}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs rounded-md transition-colors"
                        >
                          Start
                        </Button>
                        <Button
                          onClick={() => onStopInstance(instance.id)}
                          disabled={loadingFoundry || instance.status === 'stopped'}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 text-xs rounded-md transition-colors"
                        >
                          Stop
                        </Button>
                        <Button
                          onClick={() => onDeleteInstance(instance.id)}
                          disabled={loadingFoundry}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs rounded-md transition-colors"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {foundryInstances.map((instance) => (
                <div key={instance.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{instance.name}</h4>
                      <p className="text-xs text-gray-500">Port: {instance.port}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(instance.status)}`}>
                        <span className="mr-1">{getStatusIcon(instance.status)}</span>
                        {getCombinedStatusDisplay(instance)}
                      </span>
                      {instance.status === 'running' && (
                        <Button
                          onClick={() => onCheckHealth(instance.id)}
                          disabled={healthCheckingInstances.has(instance.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs rounded-md transition-colors"
                          title="Check Health"
                        >
                          {healthCheckingInstances.has(instance.id) ? '⟳' : '↻'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onStartInstance(instance.id)}
                      disabled={loadingFoundry || instance.status === 'running'}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 text-sm rounded-md transition-colors"
                    >
                      Start
                    </Button>
                    <Button
                      onClick={() => onStopInstance(instance.id)}
                      disabled={loadingFoundry || instance.status === 'stopped'}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 text-sm rounded-md transition-colors"
                    >
                      Stop
                    </Button>
                    <Button
                      onClick={() => onDeleteInstance(instance.id)}
                      disabled={loadingFoundry}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 text-sm rounded-md transition-colors"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

export default FoundryInstanceManagement;