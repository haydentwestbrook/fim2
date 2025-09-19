export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
  component?: string;
  action?: string;
  stack?: string;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  maxEntries: number;
  showTimestamp: boolean;
  showComponent: boolean;
  showStack: boolean;
}

class Logger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig = {
    enabled: false,
    level: 'info',
    maxEntries: 1000,
    showTimestamp: true,
    showComponent: true,
    showStack: false,
  };
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    // Logger instance will be made available globally after creation
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private addLog(level: LogLevel, message: string, data?: unknown, component?: string, action?: string): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      data,
      component,
      action,
      stack: level === 'error' && this.config.showStack ? new Error().stack : undefined,
    };

    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(0, this.config.maxEntries);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));

    // Console output for development
    this.logToConsole(logEntry);
  }

  private logToConsole(logEntry: LogEntry): void {
    const { level, message, data, component, action, timestamp } = logEntry;
    
    const prefix = this.config.showTimestamp 
      ? `[${timestamp.toISOString()}]` 
      : '';
    
    const componentPrefix = component && this.config.showComponent 
      ? `[${component}]` 
      : '';
    
    const actionPrefix = action 
      ? `[${action}]` 
      : '';

    const fullMessage = `${prefix}${componentPrefix}${actionPrefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(fullMessage, data || '');
        break;
      case 'info':
        console.info(fullMessage, data || '');
        break;
      case 'warn':
        console.warn(fullMessage, data || '');
        break;
      case 'error':
        console.error(fullMessage, data || '');
        if (logEntry.stack) {
          console.error('Stack trace:', logEntry.stack);
        }
        break;
    }
  }

  // Public logging methods
  debug(message: string, data?: unknown, component?: string, action?: string): void {
    this.addLog('debug', message, data, component, action);
  }

  info(message: string, data?: unknown, component?: string, action?: string): void {
    this.addLog('info', message, data, component, action);
  }

  warn(message: string, data?: unknown, component?: string, action?: string): void {
    this.addLog('warn', message, data, component, action);
  }

  error(message: string, data?: unknown, component?: string, action?: string): void {
    this.addLog('error', message, data, component, action);
  }

  // API call logging
  apiCall(method: string, url: string, data?: unknown, response?: unknown, error?: unknown): void {
    if (error) {
      this.error(`API ${method} ${url} failed`, { error, requestData: data }, 'API');
    } else {
      this.info(`API ${method} ${url}`, { requestData: data, responseData: response }, 'API');
    }
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: unknown): void {
    this.debug(`Component ${componentName} mounted`, props, componentName, 'MOUNT');
  }

  componentUnmount(componentName: string): void {
    this.debug(`Component ${componentName} unmounted`, undefined, componentName, 'UNMOUNT');
  }

  componentUpdate(componentName: string, prevProps?: unknown, nextProps?: unknown): void {
    this.debug(`Component ${componentName} updated`, { prevProps, nextProps }, componentName, 'UPDATE');
  }

  // User action logging
  userAction(action: string, data?: unknown, component?: string): void {
    this.info(`User action: ${action}`, data, component, 'USER_ACTION');
  }

  // State change logging
  stateChange(component: string, stateName: string, oldValue: unknown, newValue: unknown): void {
    this.debug(`State change: ${stateName}`, { oldValue, newValue }, component, 'STATE_CHANGE');
  }

  // Performance logging
  performance(operation: string, duration: number, data?: unknown, component?: string): void {
    this.info(`Performance: ${operation} took ${duration}ms`, data, component, 'PERFORMANCE');
  }

  // Configuration methods
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.info('Logger configuration updated', this.config, 'LOGGER', 'CONFIG_UPDATE');
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Development mode toggle
  enableDevelopmentMode(): void {
    this.setConfig({
      enabled: true,
      level: 'debug',
      showTimestamp: true,
      showComponent: true,
      showStack: true,
    });
    this.info('Development mode enabled', undefined, 'LOGGER', 'DEV_MODE');
  }

  disableDevelopmentMode(): void {
    this.setConfig({
      enabled: false,
      level: 'info',
    });
    this.info('Development mode disabled', undefined, 'LOGGER', 'DEV_MODE');
  }

  // Log management
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
    this.info('Logs cleared', undefined, 'LOGGER', 'CLEAR');
  }

  // Subscribe to log updates
  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Filter logs
  filterLogs(level?: LogLevel, component?: string, action?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (component && log.component !== component) return false;
      if (action && log.action !== action) return false;
      return true;
    });
  }
}

// Create singleton instance
const logger = new Logger();

// Function to initialize global objects (called from client-side)
export const initializeGlobalLogger = () => {
  if (typeof window !== 'undefined') {
    // Make logger instance available globally
    (window as Window & { __fimLogger?: Logger }).__fimLogger = logger;
    
    (window as Window & { fimDev?: Record<string, unknown> }).fimDev = {
      enable: () => logger.enableDevelopmentMode(),
      disable: () => logger.disableDevelopmentMode(),
      logs: () => logger.getLogs(),
      clear: () => logger.clearLogs(),
      config: (config?: Partial<LoggerConfig>) => {
        if (config) {
          logger.setConfig(config);
        } else {
          console.log('Current config:', logger.getConfig());
        }
      },
      filter: (level?: LogLevel, component?: string, action?: string) => {
        console.log('Filtered logs:', logger.filterLogs(level, component, action));
      },
      export: () => {
        const logs = logger.exportLogs();
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fim-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      test: () => {
        console.log('Testing logger...');
        logger.info('Test log message', { test: true }, 'TEST');
        console.log('Test completed. Check logs with fimDev.logs()');
      },
      help: () => {
        console.log(`
FIM Development Logger Commands:
  fimDev.enable()           - Enable development mode with debug logging
  fimDev.disable()          - Disable development mode
  fimDev.logs()             - View all logs
  fimDev.clear()            - Clear all logs
  fimDev.config()           - View current configuration
  fimDev.config({...})      - Update configuration
  fimDev.filter(level, component, action) - Filter logs
  fimDev.export()           - Export logs as JSON file
  fimDev.test()             - Test the logger
  fimDev.help()             - Show this help
        `);
      }
    };

    // Show help on first load
    console.log('FIM Development Logger loaded. Type "fimDev.help()" for available commands.');
    
    // Debug: Log that the global object was created
    console.log('fimDev object created:', typeof (window as Window & { fimDev?: Record<string, unknown> }).fimDev);
    
    return true;
  }
  return false;
};

export default logger;
