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
import { initializeFirebase } from '@/config/firebase.js';
import { logger } from '@/utils/logger.js';
import { errorHandler, notFoundHandler } from '@/middleware/error.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import API routes
import usersRouter from '@/api/users.js';
import roomsRouter from '@/api/rooms.js';
import gameRouter from '@/api/game.js';

// API routes
app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/game', gameRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.io handlers
import { initializeSocketHandlers } from '@/socket/handlers.js';
initializeSocketHandlers(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };

