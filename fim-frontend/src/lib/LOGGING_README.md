# FIM Frontend Logging System

This document describes the comprehensive logging system implemented in the FIM frontend application.

## Overview

The logging system provides:
- **Development Mode Toggle**: Enable/disable comprehensive logging via console commands
- **Multiple Log Levels**: Debug, Info, Warn, Error
- **Component Tracking**: Automatic component lifecycle logging
- **API Request/Response Logging**: Complete HTTP request tracking
- **Performance Monitoring**: Timing measurements for operations
- **User Action Tracking**: Log user interactions
- **State Change Monitoring**: Track component state changes
- **Visual Log Viewer**: In-browser log viewer for development mode
- **Export Functionality**: Export logs as JSON files

## Quick Start

### Enable Development Mode
Open the browser console and run:
```javascript
fimDev.enable()
```

### View Logs
```javascript
fimDev.logs()           // View all logs
fimDev.help()           // Show all available commands
```

### Disable Development Mode
```javascript
fimDev.disable()
```

## Console Commands

The logging system exposes a global `fimDev` object with the following commands:

### Core Commands
- `fimDev.enable()` - Enable development mode with debug logging
- `fimDev.disable()` - Disable development mode
- `fimDev.logs()` - View all logs in console
- `fimDev.clear()` - Clear all logs
- `fimDev.help()` - Show help with all commands

### Configuration
- `fimDev.config()` - View current configuration
- `fimDev.config({...})` - Update configuration

Example configuration:
```javascript
fimDev.config({
  enabled: true,
  level: 'debug',
  maxEntries: 2000,
  showTimestamp: true,
  showComponent: true,
  showStack: true
});
```

### Filtering
- `fimDev.filter(level, component, action)` - Filter logs

Examples:
```javascript
fimDev.filter('error')                    // Only error logs
fimDev.filter('info', 'DashboardPage')    // Info logs from DashboardPage
fimDev.filter(undefined, undefined, 'API') // All API action logs
```

### Export
- `fimDev.export()` - Export logs as JSON file

## Visual Log Viewer

When development mode is enabled, a green "DEV MODE" indicator appears in the top-right corner. Click the "Logs" button to open the visual log viewer.

### Log Viewer Features
- **Real-time Updates**: Logs update automatically
- **Filtering**: Filter by level, component, or action
- **Search**: Find specific log entries
- **Export**: Download logs as JSON
- **Clear**: Clear all logs
- **Auto-scroll**: Automatically scroll to new logs

## Log Levels

### Debug
- Component lifecycle events
- State changes
- Detailed operation information
- Performance measurements

### Info
- General application flow
- Successful operations
- User actions
- API responses

### Warn
- Non-critical issues
- Deprecated usage warnings
- Performance concerns

### Error
- Failed operations
- API errors
- Critical issues
- Stack traces (when enabled)

## Log Entry Structure

Each log entry contains:
```typescript
interface LogEntry {
  id: string;           // Unique identifier
  timestamp: Date;      // When the log was created
  level: LogLevel;      // debug, info, warn, error
  message: string;      // Log message
  data?: any;          // Additional data
  component?: string;   // Component name
  action?: string;      // Action type (API, USER_ACTION, etc.)
  stack?: string;       // Stack trace (errors only)
}
```

## Integration in Components

### Using the useLogger Hook

```typescript
import useLogger from '../../lib/useLogger';

export default function MyComponent() {
  const log = useLogger({ 
    component: 'MyComponent',
    logMount: true,     // Log component mount
    logUnmount: true,   // Log component unmount
    logUpdates: false   // Log component updates
  });

  const handleClick = () => {
    log.userAction('button_clicked', { buttonId: 'submit' });
  };

  const fetchData = async () => {
    const startTime = performance.now();
    try {
      const data = await api.get('/data');
      log.info('Data fetched successfully', data);
    } catch (error) {
      log.error('Data fetch failed', error);
    } finally {
      const duration = performance.now() - startTime;
      log.performance('fetchData', duration);
    }
  };

  return <div>...</div>;
}
```

### Direct Logger Usage

```typescript
import logger from '../../lib/logger';

// Basic logging
logger.info('Operation completed', { result: 'success' });
logger.error('Operation failed', error);

// Component-specific logging
logger.debug('Component state updated', newState, 'MyComponent', 'STATE_CHANGE');

// API logging
logger.apiCall('GET', '/api/users', requestData, responseData);

// Performance logging
logger.performance('dataProcessing', 150, { recordCount: 100 });
```

## API Logging

The API layer automatically logs all HTTP requests and responses:

- **Request Logging**: Method, URL, request data
- **Response Logging**: Response data, status codes
- **Error Logging**: Error details, status codes
- **Performance Logging**: Request duration

## Performance Monitoring

The system tracks performance for:
- API requests
- Component operations
- User actions
- Custom operations

Example:
```typescript
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;
log.performance('operationName', duration, { additionalData });
```

## Configuration Options

```typescript
interface LoggerConfig {
  enabled: boolean;        // Enable/disable logging
  level: LogLevel;         // Minimum log level
  maxEntries: number;      // Maximum log entries to keep
  showTimestamp: boolean;  // Show timestamps in console
  showComponent: boolean;  // Show component names
  showStack: boolean;      // Show stack traces for errors
}
```

## Best Practices

### 1. Use Appropriate Log Levels
- **Debug**: Detailed information for debugging
- **Info**: General application flow
- **Warn**: Potential issues
- **Error**: Actual problems

### 2. Include Context
```typescript
// Good
logger.info('User login successful', { userId: user.id, timestamp: Date.now() });

// Bad
logger.info('Login successful');
```

### 3. Use Component Names
```typescript
// Good
logger.error('Failed to load data', error, 'UserProfile');

// Bad
logger.error('Failed to load data', error);
```

### 4. Log User Actions
```typescript
// Track important user interactions
log.userAction('form_submitted', { formType: 'registration' });
log.userAction('button_clicked', { buttonId: 'delete-user' });
```

### 5. Performance Monitoring
```typescript
// Monitor slow operations
const startTime = performance.now();
await heavyOperation();
const duration = performance.now() - startTime;
log.performance('heavyOperation', duration);
```

## Troubleshooting

### Logs Not Appearing
1. Check if development mode is enabled: `fimDev.config()`
2. Verify log level: `fimDev.config({ level: 'debug' })`
3. Check browser console for errors

### Performance Issues
1. Reduce log level: `fimDev.config({ level: 'warn' })`
2. Limit log entries: `fimDev.config({ maxEntries: 100 })`
3. Disable development mode: `fimDev.disable()`

### Memory Usage
- Logs are automatically limited to `maxEntries` (default: 1000)
- Use `fimDev.clear()` to clear logs manually
- Export and clear logs regularly in long development sessions

## Security Considerations

- **Production**: Development mode should be disabled in production
- **Sensitive Data**: Avoid logging sensitive information (passwords, tokens)
- **Data Sanitization**: Sanitize data before logging
- **Log Retention**: Logs are stored in memory only, not persisted

## Future Enhancements

Potential improvements:
- Remote log shipping
- Log persistence
- Advanced filtering and search
- Log analytics dashboard
- Integration with external monitoring tools
- Custom log formatters
- Log sampling for high-volume applications
