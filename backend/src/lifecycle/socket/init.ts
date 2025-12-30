import { Server } from 'socket.io';
import { streamManager } from '../../utils/llm/stream-manager';
import { handleRoomJoin } from './handlers/room-join';
import { handleTurnProcess, handlePlayerAction } from './handlers/turn-handlers';
import { handlePlayerReady } from './handlers/player-handlers';
import { StrapiWithServer } from './types';
import { validateRoomJoin, validateTurnProcess, validatePlayerAction, validatePlayerReady } from './validation';

export const initSocket = (strapi: StrapiWithServer) => {
  const httpServer = strapi.server.httpServer;

  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.PUBLIC_CLIENT_URL].filter(
        Boolean
      ) as string[],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  streamManager.setSocketServer(io);

  io.on('connection', (socket) => {
    strapi.log.info(`Socket connected: ${socket.id}`);

    const onRoomJoin = handleRoomJoin(strapi);
    const onTurnProcess = handleTurnProcess(strapi);
    const onPlayerAction = handlePlayerAction(strapi);
    const onPlayerReady = handlePlayerReady(strapi);

    socket.on('room:join', (data) => {
      try {
        const validated = validateRoomJoin(data);
        onRoomJoin(socket, validated);
      } catch (error) {
        strapi.log.warn(`Invalid room:join payload from ${socket.id}:`, error);
        socket.emit('error', { message: 'Invalid payload' });
      }
    });

    socket.on('turn:process', (data) => {
      try {
        const validated = validateTurnProcess(data);
        onTurnProcess(socket, validated);
      } catch (error) {
        strapi.log.warn(`Invalid turn:process payload from ${socket.id}:`, error);
        socket.emit('error', { message: 'Invalid payload' });
      }
    });

    socket.on('player:action', (data) => {
      try {
        const validated = validatePlayerAction(data);
        onPlayerAction(socket, validated);
      } catch (error) {
        strapi.log.warn(`Invalid player:action payload from ${socket.id}:`, error);
        socket.emit('error', { message: 'Invalid payload' });
      }
    });

    socket.on('player:ready', (data) => {
      try {
        const validated = validatePlayerReady(data);
        onPlayerReady(socket, validated);
      } catch (error) {
        strapi.log.warn(`Invalid player:ready payload from ${socket.id}:`, error);
        socket.emit('error', { message: 'Invalid payload' });
      }
    });

    socket.on('disconnect', () => {
      // Disconnect logic
    });
  });

  strapi.log.info('Socket.IO server initialized successfully');
};
