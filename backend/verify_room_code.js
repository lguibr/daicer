import axios from 'axios';

const API_URL = 'http://localhost:1337/api';

async function verify() {
  try {
    // 1. Register User
    const username = `testuser_${Date.now()}`;
    console.log(`Registering user: ${username}`);

    const registerRes = await axios.post(`${API_URL}/auth/local/register`, {
      username: username,
      email: `${username}@example.com`,
      password: 'password123',
    });

    const jwt = registerRes.data.jwt;
    const user = registerRes.data.user;
    console.log(`User registered. ID: ${user.id}`);

    // 2. Create Room
    console.log('Creating room...');
    const createRes = await axios.post(
      `${API_URL}/rooms`,
      {
        data: {
          settings: {},
          structures: [],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    const room = createRes.data.data;
    console.log('Room created:', room);

    // 3. Verify Code
    const code = room.code;
    const roomId = room.roomId; // Should be same as code
    const dbId = room.id; // numeric or docId

    console.log(`ID: ${dbId}, Code: ${code}, RoomID: ${roomId}`);

    if (!code || typeof code !== 'string' || code.length !== 6) {
      console.error('FAIL: Code is not a 6-character string.');
      process.exit(1);
    }

    // Check if code matches generated logic if possible?
    // We just check it's not UUID (36 chars)
    if (code.length > 10) {
      console.error('FAIL: Code seems to be a UUID or too long.');
      process.exit(1);
    }

    console.log('SUCCESS: Room code valid.');
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

verify();
