'use client';

import { useEffect } from 'react';
import { initializeGlobalLogger } from '../lib/logger';

export default function LoggerInitializer() {
  useEffect(() => {
    // Initialize the global logger objects
    const success = initializeGlobalLogger();
    if (success) {
      console.log('Logger initialized successfully');
      console.log('fimDev available:', typeof (window as Window & { fimDev?: Record<string, unknown> }).fimDev);
      
      // Test the logger
      setTimeout(() => {
        const fimDev = (window as Window & { fimDev?: Record<string, unknown> }).fimDev;
        if (fimDev) {
          console.log('Testing fimDev...');
          fimDev.info = fimDev.info || (() => console.log('fimDev.info not available'));
        }
      }, 100);
    } else {
      console.warn('Failed to initialize logger - not in browser environment');
    }
  }, []);

  return null; // This component doesn't render anything
}
