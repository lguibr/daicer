/**
 * Socket.IO Instance Singleton
 * Avoids circular dependency between server.ts and API routes
 */

import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from './types';

type SocketIOServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

let ioInstance: SocketIOServer | null = null;

/**
 * Set the Socket.IO instance (called by server.ts after initialization)
 */
export function setIO(server: SocketIOServer): void {
  ioInstance = server;
}

/**
 * Get the Socket.IO instance
 * @throws Error if called before setIO
 */
export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized. Call setIO() first.');
  }
  return ioInstance;
}
