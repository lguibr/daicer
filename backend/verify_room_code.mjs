const API_URL = 'http://127.0.0.1:1337/api';

async function verify() {
  try {
    // 1. Register User
    const username = `testuser_${Date.now()}`;
    console.log(`Registering user: ${username} at ${API_URL}`);

    const registerRes = await fetch(`${API_URL}/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        email: `${username}@example.com`,
        password: 'password123',
      }),
    });

    if (!registerRes.ok) {
      const text = await registerRes.text();
      throw new Error(`Register failed: ${registerRes.status} ${text}`);
    }

    const registerData = await registerRes.json();
    const jwt = registerData.jwt;
    const user = registerData.user;
    console.log(`User registered. ID: ${user.id}`);

    // 2. Create Room
    console.log('Creating room...');
    const createRes = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        data: {
          settings: {},
          structures: [],
        },
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Create Room failed: ${createRes.status} ${text}`);
    }

    const createData = await createRes.json();
    const room = createData.data;
    console.log('Room created:', room);

    // 3. Verify Code
    const code = room.code;
    const roomId = room.roomId;
    const dbId = room.id;

    console.log(`ID: ${dbId}, Code: ${code}, RoomID: ${roomId}`);

    if (!code || typeof code !== 'string' || code.length !== 6) {
      console.error('FAIL: Code is not a 6-character string.');
      process.exit(1);
    }

    if (code.length > 10) {
      console.error('FAIL: Code seems to be a UUID or too long.');
      process.exit(1);
    }

    console.log('SUCCESS: Room code valid.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verify();
