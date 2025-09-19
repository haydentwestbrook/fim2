'use client';

import { useState, useEffect } from 'react';
import logger, { LogEntry, LogLevel } from '../../lib/logger';

interface LogViewerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function LogViewer({ isVisible, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<{
    level?: LogLevel;
    component?: string;
    action?: string;
  }>({});
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const unsubscribe = logger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter.level && log.level !== filter.level) return false;
    if (filter.component && log.component !== filter.component) return false;
    if (filter.action && log.action !== filter.action) return false;
    return true;
  });

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'debug': return 'text-gray-500';
      case 'info': return 'text-blue-600';
      case 'warn': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-900';
    }
  };

  const getLevelBgColor = (level: LogLevel): string => {
    switch (level) {
      case 'debug': return 'bg-gray-100';
      case 'info': return 'bg-blue-50';
      case 'warn': return 'bg-yellow-50';
      case 'error': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const clearLogs = () => {
    logger.clearLogs();
  };

  const exportLogs = () => {
    const logsJson = logger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fim-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueComponents = Array.from(new Set(logs.map(log => log.component).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(log => log.action).filter(Boolean)));

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Development Logs</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Clear
            </button>
            <button
              onClick={exportLogs}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Export
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium mb-1">Level:</label>
              <select
                value={filter.level || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value as LogLevel || undefined }))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">All</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Component:</label>
              <select
                value={filter.component || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, component: e.target.value || undefined }))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">All</option>
                {uniqueComponents.map(component => (
                  <option key={component} value={component}>{component}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Action:</label>
              <select
                value={filter.action || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, action: e.target.value || undefined }))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">All</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoScroll"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoScroll" className="text-sm">Auto-scroll</label>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No logs to display
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded border-l-4 ${getLevelBgColor(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`font-mono text-xs font-semibold ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    {log.component && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {log.component}
                      </span>
                    )}
                    {log.action && (
                      <span className="text-xs bg-blue-200 px-2 py-1 rounded">
                        {log.action}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm">
                    {log.message}
                  </div>
                  {log.data != null && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">
                        Data
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">
                        Stack Trace
                      </summary>
                      <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
