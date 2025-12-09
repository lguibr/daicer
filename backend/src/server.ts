/**
 * Main server entry point
 * Initializes Express, Socket.io, and Firebase
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { initializeFirebase } from '@/config/firebase';
import { logger } from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/error';
import { initWorkerPool, shutdownWorkerPool } from '@/workers/workerPool';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@/socket/types';

// Import API routes
import authRouter from '@/api/auth';
import usersRouter from '@/api/users';
import roomsRouter from '@/api/rooms';
import gameRouter from '@/api/game';
import gameDataRouter from '@/api/game-data';
import combatSimRouter from '@/api/combat-sim';
import spellsRouter from '@/api/spells';
import assetsRouter from '@/api/assets';
import assetsGenerationRouter from '@/api/assets-generation';
import charactersRouter from '@/api/characters';
import structuresRouter from '@/api/structures';
import equipmentRouter from '@/api/equipment';
import tacticalRouter from '@/api/tactical/units';
import tacticalActionsRouter from '@/api/tactical/actions';
import tacticalMapRouter from '@/api/tactical';
import openapiRouter from '@/api/openapi';
import gridChunksRouter from '@/api/grid-chunks';
import graphSectionsRouter from '@/api/graph-sections';
import terrainRouter from '@/api/terrain';
import exploreRouter from '@/routes/explore';

// Socket.io handlers
import { initializeSocketHandlers } from '@/socket/handlers';
import { setIO } from '@/socket/instance';
import { streamManager } from '@/services/llm/stream-manager';

// Get directory path for ES modules
// Load environment variables from backend and root
const appRoot = process.cwd();
const backendEnvLocal = path.resolve(appRoot, '.env.local');
const rootEnvLocal = path.resolve(appRoot, '../.env.local');
const backendEnv = path.resolve(appRoot, '.env');

dotenv.config({ path: backendEnvLocal });
dotenv.config({ path: rootEnvLocal });
dotenv.config({ path: backendEnv });

// Initialize Firebase
initializeFirebase();

// Initialize Worker Pool
initWorkerPool();

const app = express();
const httpServer = createServer(app);

// Socket.io setup with best practices
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3100'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  // Transport configuration
  transports: ['websocket', 'polling'],
  // Connection tuning
  pingTimeout: 60000, // 60s - how long to wait for pong before considering connection closed
  pingInterval: 25000, // 25s - how often to send ping packets
  connectTimeout: 45000, // 45s - time to wait for successful namespace join
  // Performance
  maxHttpBufferSize: 1e7, // 10MB for large chunk data
  httpCompression: {
    threshold: 2048, // compress if >= 2KB
  },
  // WebSocket compression (disabled for performance)
  perMessageDeflate: false,
  // Connection state recovery for reliability
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true, // Skip auth middleware on recovery
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3100'],
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server status and timestamp. Used for liveness probes.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-11-15T12:00:00.000Z
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OpenAPI documentation
app.use('/api-docs', openapiRouter);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/game', gameRouter);
app.use('/api/game-data', gameDataRouter);
app.use('/api/combat', combatSimRouter);
app.use('/api/spells', spellsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/assets-gen', assetsGenerationRouter);
app.use('/api/characters', charactersRouter);
app.use('/api/structures', structuresRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/tactical', tacticalRouter);
app.use('/api/tactical', tacticalActionsRouter);
app.use('/api/tactical', tacticalMapRouter);
app.use('/api/grid', gridChunksRouter);
app.use('/api/graph', graphSectionsRouter); // NEW: Section graph endpoints
app.use('/api/terrain', terrainRouter); // NEW: Terrain generation endpoints
app.use('/api/explore', exploreRouter); // NEW: Exploration prototype endpoints

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO initialization
setIO(io); // Store instance for use in API routes
streamManager.setSocketServer(io);
initializeSocketHandlers(io);

// Socket.IO engine error monitoring
io.engine.on('connection_error', (err) => {
  logger.error('[Engine.IO] Connection error:', {
    code: err.code,
    message: err.message,
    context: err.context,
  });
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    await shutdownWorkerPool();
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing HTTP server');
    await shutdownWorkerPool();
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

export { app, io, httpServer };
