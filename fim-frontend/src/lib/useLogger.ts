import { useEffect, useRef } from 'react';
import logger, { LogEntry } from './logger';

export interface UseLoggerOptions {
  component: string;
  logMount?: boolean;
  logUnmount?: boolean;
  logUpdates?: boolean;
}

export function useLogger(options: UseLoggerOptions) {
  const { component, logMount = true, logUnmount = true, logUpdates = false } = options;
  const prevPropsRef = useRef<any>(null);

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
    debug: (message: string, data?: any, action?: string) => 
      logger.debug(message, data, component, action),
    info: (message: string, data?: any, action?: string) => 
      logger.info(message, data, component, action),
    warn: (message: string, data?: any, action?: string) => 
      logger.warn(message, data, component, action),
    error: (message: string, data?: any, action?: string) => 
      logger.error(message, data, component, action),
    userAction: (action: string, data?: any) => 
      logger.userAction(action, data, component),
    stateChange: (stateName: string, oldValue: any, newValue: any) => 
      logger.stateChange(component, stateName, oldValue, newValue),
    performance: (operation: string, duration: number, data?: any) => 
      logger.performance(operation, duration, data, component),
    apiCall: (method: string, url: string, data?: any, response?: any, error?: any) => 
      logger.apiCall(method, url, data, response, error),
  };
}

export default useLogger;
