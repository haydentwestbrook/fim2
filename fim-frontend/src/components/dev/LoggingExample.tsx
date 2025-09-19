'use client';

import { useState } from 'react';
import useLogger from '../../lib/useLogger';

export default function LoggingExample() {
  const log = useLogger({ component: 'LoggingExample' });
  const [count, setCount] = useState(0);
  const [data, setData] = useState<unknown>(null);

  const handleIncrement = () => {
    const oldCount = count;
    const newCount = count + 1;
    setCount(newCount);
    log.userAction('increment_button_clicked', { oldCount, newCount });
    log.stateChange('count', oldCount, newCount);
  };

  const handleDecrement = () => {
    const oldCount = count;
    const newCount = count - 1;
    setCount(newCount);
    log.userAction('decrement_button_clicked', { oldCount, newCount });
    log.stateChange('count', oldCount, newCount);
  };

  const handleFetchData = async () => {
    const startTime = performance.now();
    log.info('Starting data fetch simulation');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData = { id: 1, name: 'Example Data', timestamp: new Date() };
      setData(mockData);
      log.info('Data fetch simulation completed', mockData);
    } catch (error) {
      log.error('Data fetch simulation failed', error);
    } finally {
      const duration = performance.now() - startTime;
      log.performance('fetchDataSimulation', duration);
    }
  };

  const handleError = () => {
    try {
      throw new Error('This is a test error for logging demonstration');
    } catch (error) {
      log.error('Test error triggered', error);
    }
  };

  const handleWarning = () => {
    log.warn('This is a test warning message', { 
      warningType: 'demo', 
      timestamp: new Date() 
    });
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Logging System Demo</h3>
      <p className="text-sm text-gray-600 mb-4">
        This component demonstrates the logging system. Open the console and run{' '}
        <code className="bg-gray-200 px-1 rounded">fimDev.enable()</code> to see logs.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleIncrement}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment ({count})
          </button>
          <button
            onClick={handleDecrement}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Decrement
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleFetchData}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Simulate Data Fetch
          </button>
          <button
            onClick={handleError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Trigger Error
          </button>
          <button
            onClick={handleWarning}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Trigger Warning
          </button>
        </div>

        {data != null && (
          <div className="p-3 bg-green-100 rounded border">
            <p className="text-sm font-medium">Fetched Data:</p>
            <pre className="text-xs mt-1">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Try these console commands:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><code>fimDev.enable()</code> - Enable development mode</li>
            <li><code>fimDev.logs()</code> - View all logs</li>
            <li><code>fimDev.filter(&apos;error&apos;)</code> - Filter error logs</li>
            <li><code>fimDev.export()</code> - Export logs as JSON</li>
            <li><code>fimDev.help()</code> - Show all commands</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
