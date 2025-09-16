import React from 'react';
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

interface SystemHealthCardProps {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function SystemHealthCard({ health, loading, error, onRefresh }: SystemHealthCardProps) {
  return (
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
          <Button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 font-bold text-white bg-gray-500 rounded hover:bg-gray-700"
          >
            Refresh Health
          </Button>
        </div>
      )}
    </Card>
  );
}