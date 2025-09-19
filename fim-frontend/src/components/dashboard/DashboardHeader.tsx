import React, { memo } from 'react';
import { Card } from "../ui/Card";

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

interface DashboardHeaderProps {
  health: HealthStatus | null;
  foundryInstances: FoundryInstance[];
  loading: boolean;
}

const DashboardHeader = memo(function DashboardHeader({ 
  health, 
  foundryInstances, 
  loading 
}: DashboardHeaderProps) {
  const runningInstances = foundryInstances.filter(instance => instance.status === 'running').length;
  const totalInstances = foundryInstances.length;
  const systemStatus = health?.status === 'ok' ? 'healthy' : 'unhealthy';
  
  const stats = [
    {
      title: 'System Status',
      value: systemStatus,
      status: health?.status === 'ok' ? 'success' : 'error',
      description: health?.status === 'ok' ? 'All systems operational' : 'System issues detected'
    },
    {
      title: 'Running Instances',
      value: runningInstances,
      status: runningInstances > 0 ? 'success' : 'neutral',
      description: `${runningInstances} of ${totalInstances} instances active`
    },
    {
      title: 'Total Instances',
      value: totalInstances,
      status: 'neutral',
      description: 'Foundry instances configured'
    },
    {
      title: 'Database',
      value: health?.info?.database?.status || 'unknown',
      status: health?.info?.database?.status === 'up' ? 'success' : 'error',
      description: health?.info?.database?.status === 'up' ? 'Connected' : 'Disconnected'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'neutral': return '○';
      default: return '○';
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your Foundry instances</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`p-6 border-l-4 ${getStatusColor(stat.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {typeof stat.value === 'string' ? stat.value.toUpperCase() : stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
              <div className={`text-2xl ${getStatusColor(stat.status).split(' ')[0]}`}>
                {getStatusIcon(stat.status)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});

export default DashboardHeader;
