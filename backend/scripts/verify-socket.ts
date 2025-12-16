import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:1337';
const ROOM_ID = 'iiotv0tbn6z7xip6c92navg9'; // User's active room

async function verifyGameFlow() {
  console.log('🔌 Connecting to socket server at', SOCKET_URL);

  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('✅ Connected to socket:', socket.id);

    console.log(`🚪 Attempting to join room ${ROOM_ID}...`);
    socket.emit('room:join', { roomId: ROOM_ID, userId: 'test-monitor-user' });
  });

  socket.on('game:state', (data) => {
    console.log('📦 Received Game State!');
    console.log('   - Players:', data.players?.length);
    console.log('   - Messages:', data.messages?.length);
    if (data.messages?.length > 0) {
      console.log('   - Sample Message:', data.messages[data.messages.length - 1]);
    }
    console.log('   - Terrain Data Present:', !!data.terrain);
    console.log('   - Room Phase:', data.room?.phase);

    // Keep connection open briefly to see if we get updates
    setTimeout(() => {
      socket.disconnect();
      process.exit(0);
    }, 2000);
  });

  socket.on('error', (err) => {
    console.error('❌ Socket Error:', err);
    process.exit(1);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
  });

  setTimeout(() => {
    console.log('⏰ Timeout waiting for game state');
    socket.disconnect();
    process.exit(1);
  }, 10000);
}

verifyGameFlow();
