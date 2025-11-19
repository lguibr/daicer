/**
 * Server-Sent Events (SSE) Middleware
 * Setup and utilities for real-time event streaming
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * Setup SSE response headers
 * Configures response for Server-Sent Events streaming
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export function setupSSE(_req: Request, res: Response, next: NextFunction): void {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // CORS for SSE
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Flush headers immediately
  res.flushHeaders();

  // Send comment to keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000); // Every 15 seconds

  // Cleanup on connection close
  _req.on('close', () => {
    clearInterval(keepAlive);
    logger.debug('[SSE] Connection closed');
  });

  next();
}

/**
 * Send SSE event to client
 *
 * @param res - Express response
 * @param event - Event to send
 *
 * @example
 * ```typescript
 * sendSSE(res, {
 *   type: 'node_start',
 *   data: { node: 'init_world' }
 * });
 * ```
 */
export function sendSSE(res: Response, event: { type: string; data: any }): void {
  try {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    logger.debug(`[SSE] Sent event: ${event.type}`, { dataKeys: Object.keys(event.data) });
  } catch (error) {
    logger.error('[SSE] Failed to send event:', error);
  }
}

/**
 * Send error event and close connection
 */
export function sendSSEError(res: Response, error: string, details?: any): void {
  sendSSE(res, {
    type: 'error',
    data: { error, details, timestamp: Date.now() },
  });
  res.end();
}

/**
 * Send completion event and close connection
 */
export function sendSSEComplete(res: Response, data: any = {}): void {
  sendSSE(res, {
    type: 'complete',
    data: { ...data, timestamp: Date.now() },
  });
  res.end();
}
