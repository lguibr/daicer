# Frontend Services

Service layer for external integrations.

## Services

- **firebase.ts** - Firebase client initialization
- **api.ts** - Backend HTTP client
- **socket.ts** - Socket.io real-time client

## Architecture

```mermaid
graph LR
    Components[React Components] --> Hooks[Custom Hooks]
    Hooks --> Services[Services]

    Services --> Firebase[Firebase Auth]
    Services --> API[REST API]
    Services --> Socket[Socket.io]

    API --> Backend[Backend Server]
    Socket --> Backend
```

## Patterns

- All API calls return typed promises
- Errors are thrown and handled by components
- Auth token automatically included
- Socket reconnection handled automatically
