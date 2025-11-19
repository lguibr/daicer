/**
 * Winston logger configuration
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const msg = stack || message;
  const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${ts as string} [${level}]: ${msg as string}${metaString}`;
});

/**
 * Create Winston logger instance
 * @returns Configured logger
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'silly',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),
  ],
  exitOnError: false,
});

/**
 * Log HTTP request
 * @param method - HTTP method
 * @param path - Request path
 * @param statusCode - Response status code
 * @param duration - Request duration in ms
 */
export function logRequest(method: string, path: string, statusCode: number, duration: number): void {
  logger.info(`${method} ${path} ${statusCode} - ${duration}ms`);
}

/**
 * Log error with context
 * @param error - Error object
 * @param context - Additional context
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}
