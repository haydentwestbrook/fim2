'use client';

import { useState, useEffect } from 'react';
import logger from '../../lib/logger';
import LogViewer from './LogViewer';

export default function DevModeIndicator() {
  const [isDevMode, setIsDevMode] = useState(false);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    // Check if dev mode is enabled
    const config = logger.getConfig();
    setIsDevMode(config.enabled);

    // Subscribe to config changes
    const checkConfig = () => {
      const currentConfig = logger.getConfig();
      setIsDevMode(currentConfig.enabled);
    };

    // Subscribe to log updates to show count
    const unsubscribe = logger.subscribe((logs) => {
      setLogCount(logs.length);
    });

    // Check config periodically
    const interval = setInterval(checkConfig, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!isDevMode) return null;

  return (
    <>
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">DEV MODE</span>
          <button
            onClick={() => setShowLogViewer(true)}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            Logs ({logCount})
          </button>
        </div>
      </div>
      
      <LogViewer 
        isVisible={showLogViewer} 
        onClose={() => setShowLogViewer(false)} 
      />
    </>
  );
}
