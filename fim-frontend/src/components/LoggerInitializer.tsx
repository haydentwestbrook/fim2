'use client';

import { useEffect } from 'react';
import { initializeGlobalLogger } from '../lib/logger';

export default function LoggerInitializer() {
  useEffect(() => {
    // Initialize the global logger objects
    const success = initializeGlobalLogger();
    if (success) {
      console.log('Logger initialized successfully');
      console.log('fimDev available:', typeof (window as any).fimDev);
      
      // Test the logger
      setTimeout(() => {
        if ((window as any).fimDev) {
          console.log('Testing fimDev...');
          (window as any).fimDev.info = (window as any).fimDev.info || (() => console.log('fimDev.info not available'));
        }
      }, 100);
    } else {
      console.warn('Failed to initialize logger - not in browser environment');
    }
  }, []);

  return null; // This component doesn't render anything
}
