# Socket.io Handlers

Real-time WebSocket communication for multiplayer gameplay.

## Architecture

```mermaid
graph TB
    Client1[Client 1] -->|WebSocket| Server[Socket.io Server]
    Client2[Client 2] -->|WebSocket| Server
    Client3[Client N] -->|WebSocket| Server
    
    Server --> Room[Room Namespaces]
    Room --> Handlers[Event Handlers]
    
    Handlers --> Auth[Socket Auth]
    Handlers --> Game[Game Service]
    Handlers --> FS[Firestore]
    
    Server -->|Broadcast| Client1
    Server -->|Broadcast| Client2
    Server -->|Broadcast| Client3
```

## Events

### Client → Server

- `room:join` - Join a game room
- `room:leave` - Leave a game room
- `player:action` - Submit player action
- `turn:process` - Request turn processing

### Server → Client

- `room:updated` - Room state changed
- `player:joined` - New player joined
- `player:left` - Player left
- `game:state` - Full state sync
- `error` - Error occurred

## Room Namespacing

Each game room operates in isolation:
- Clients join `/room/{roomId}` namespace
- Events only broadcast within the room
- Automatic cleanup on disconnect

## Authentication

Socket connections require:
1. Valid Firebase ID token
2. Active user session
3. Room membership (after joining)

