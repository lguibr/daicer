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

// Import API routes
import usersRouter from '@/api/users';
import roomsRouter from '@/api/rooms';
import gameRouter from '@/api/game';
import gameDataRouter from '@/api/game-data';
import combatSimRouter from '@/api/combat-sim';
import spellsRouter from '@/api/spells';
import assetsRouter from '@/api/assets';
import charactersRouter from '@/api/characters';

// Socket.io handlers
import { initializeSocketHandlers } from '@/socket/handlers';

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

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/game', gameRouter);
app.use('/api/game-data', gameDataRouter);
app.use('/api/combat', combatSimRouter);
app.use('/api/spells', spellsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/characters', charactersRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
initializeSocketHandlers(io);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export { app, io, httpServer };
