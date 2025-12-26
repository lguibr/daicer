import { Server } from 'socket.io';
import { streamManager } from '../../utils/llm/stream-manager';
import { handleRoomJoin } from './handlers/room-join';
import { handleTurnProcess, handlePlayerAction } from './handlers/turn-handlers';

export const initSocket = (strapi) => {
  // @ts-ignore
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

    socket.on('room:join', (data) => onRoomJoin(socket, data));
    socket.on('turn:process', (data) => onTurnProcess(socket, data));
    socket.on('player:action', (data) => onPlayerAction(socket, data));

    socket.on('disconnect', () => {
      // Disconnect logic
    });
  });

  strapi.log.info('Socket.IO server initialized successfully');
};
