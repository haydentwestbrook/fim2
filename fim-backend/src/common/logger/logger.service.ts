import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    const logContext = context || this.context;
    console.log(`[LOG] ${logContext ? `[${logContext}] ` : ''}${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    const logContext = context || this.context;
    console.error(`[ERROR] ${logContext ? `[${logContext}] ` : ''}${trace ? `[${trace}] ` : ''}${message}`);
  }

  warn(message: string, context?: string) {
    const logContext = context || this.context;
    console.warn(`[WARN] ${logContext ? `[${logContext}] ` : ''}${message}`);
  }

  debug(message: string, context?: string) {
    const logContext = context = context || this.context;
    console.debug(`[DEBUG] ${logContext ? `[${logContext}] ` : ''}${message}`);
  }

  verbose(message: string, context?: string) {
    const logContext = context || this.context;
    console.log(`[VERBOSE] ${logContext ? `[${logContext}] ` : ''}${message}`);
  }
}