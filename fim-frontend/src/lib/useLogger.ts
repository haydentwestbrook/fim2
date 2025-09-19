import { useEffect, useRef } from 'react';
import logger from './logger';

export interface UseLoggerOptions {
  component: string;
  logMount?: boolean;
  logUnmount?: boolean;
  logUpdates?: boolean;
}

export function useLogger(options: UseLoggerOptions) {
  const { component, logMount = true, logUnmount = true, logUpdates = false } = options;
  const prevPropsRef = useRef<unknown>(null);

  // Log component mount
  useEffect(() => {
    if (logMount) {
      logger.componentMount(component);
    }

    return () => {
      if (logUnmount) {
        logger.componentUnmount(component);
      }
    };
  }, [component, logMount, logUnmount]);

  // Log component updates
  useEffect(() => {
    if (logUpdates && prevPropsRef.current !== null) {
      logger.componentUpdate(component, prevPropsRef.current, {});
    }
    prevPropsRef.current = {};
  });

  return {
    debug: (message: string, data?: unknown, action?: string) => 
      logger.debug(message, data, component, action),
    info: (message: string, data?: unknown, action?: string) => 
      logger.info(message, data, component, action),
    warn: (message: string, data?: unknown, action?: string) => 
      logger.warn(message, data, component, action),
    error: (message: string, data?: unknown, action?: string) => 
      logger.error(message, data, component, action),
    userAction: (action: string, data?: unknown) => 
      logger.userAction(action, data, component),
    stateChange: (stateName: string, oldValue: unknown, newValue: unknown) => 
      logger.stateChange(component, stateName, oldValue, newValue),
    performance: (operation: string, duration: number, data?: unknown) => 
      logger.performance(operation, duration, data, component),
    apiCall: (method: string, url: string, data?: unknown, response?: unknown, error?: unknown) => 
      logger.apiCall(method, url, data, response, error),
  };
}

export default useLogger;
