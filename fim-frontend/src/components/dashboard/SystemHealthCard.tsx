import React, { memo } from 'react';
import { Card } from "../ui/Card";
import { Alert, AlertTitle, AlertDescription } from "../ui/Alert";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Button } from "../ui/Button";

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

interface SystemHealthCardProps {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const SystemHealthCard = memo(function SystemHealthCard({ health, loading, error, onRefresh }: SystemHealthCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
      case 'up':
        return '✓';
      case 'error':
      case 'down':
        return '✗';
      default:
        return '⚠';
    }
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
        <Button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {health && !loading && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border-l-4 ${getStatusColor(health.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Overall System</h3>
                <p className="text-sm text-gray-600">All components status</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getStatusIcon(health.status)}</span>
                <span className="font-semibold">{health.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Component Status */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 mb-3">Component Status</h3>
            
            {/* Database Status */}
            <div className={`p-3 rounded-lg border ${getStatusColor(health.info.database.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span className="font-medium">Database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{getStatusIcon(health.info.database.status)}</span>
                  <span className="font-medium">{health.info.database.status.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Foundry Status */}
            <div className={`p-3 rounded-lg border ${getStatusColor(health.info.foundry.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span className="font-medium">Foundry Service</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{getStatusIcon(health.info.foundry.status)}</span>
                  <span className="font-medium">{health.info.foundry.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Last Check Time */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Last checked: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
});

export default SystemHealthCard;