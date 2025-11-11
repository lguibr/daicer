# Daicer Backend

<div align="center">

![Daicer Logo](../frontend/public/logo.png)

[![CI](https://github.com/YOUR_USERNAME/daicer/workflows/CI/badge.svg)](https://github.com/YOUR_USERNAME/daicer/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-black?logo=express)](https://expressjs.com/)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]()
[![Code Style](https://img.shields.io/badge/code%20style-airbnb-ff5a5f)](https://github.com/airbnb/javascript)

</div>

Multiplayer D&D dungeon master backend built with Express, Socket.io, Firebase, and LangChain.

## Architecture

```mermaid
graph TB
    Client[React Client] -->|HTTP/WS| LB[Load Balancer]
    LB --> CR[Cloud Run Backend]
    CR -->|Admin SDK| FS[Firestore]
    CR -->|Admin SDK| FA[Firebase Auth]
    CR -->|LangChain| LLM[LLM Providers]

    subgraph "LLM Providers"
        LLM --> Gemini
        LLM --> OpenAI
        LLM --> Anthropic
    end

    subgraph "Cloud Run"
        CR --> Express[Express REST API]
        CR --> SocketIO[Socket.io]
        Express --> Middleware[Auth/Validation]
        SocketIO --> Handlers[Event Handlers]
    end
```

## Project Structure

```
backend/
├── src/
│   ├── api/           # REST API endpoints
│   ├── socket/        # Socket.io event handlers
│   ├── services/      # Business logic (Firebase, LLM, Game)
│   ├── middleware/    # Express middleware (auth, validation, error)
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Helper functions
│   ├── config/        # Configuration (Firebase, LangChain)
│   └── server.ts      # Entry point
├── tests/             # Test files
├── Dockerfile         # Container definition
└── cloudbuild.yaml    # Cloud Build config
```

## Local Development

### Prerequisites

- Node.js 20+
- Yarn
- Firebase CLI
- Docker (optional)

### Setup

1. Install dependencies:

```bash
yarn install
```

2. Configure environment:

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. Start Firebase emulators (Terminal 1):

```bash
cd ..
yarn emulators
```

4. Start backend (Terminal 2):

```bash
yarn dev
```

Backend runs on `http://localhost:3001`

### With Docker

```bash
docker-compose up backend
```

## Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Lint code
- `yarn lint:fix` - Fix linting issues
- `yarn format` - Format code with Prettier
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Generate coverage report
- `yarn typecheck` - Type-check without emitting

## API Endpoints

### Health

- `GET /health` - Health check

### Rooms

- `POST /api/rooms` - Create new room
- `POST /api/rooms/:code/join` - Join room by code
- `GET /api/rooms/:roomId` - Get room state
- `PATCH /api/rooms/:roomId/settings` - Update settings (owner only)
- `DELETE /api/rooms/:roomId` - Delete room (owner only)

### Game

- `POST /api/game/:roomId/world` - Generate world (owner only)
- `POST /api/game/:roomId/character` - Add character
- `POST /api/game/:roomId/turn` - Process turn

## Socket.io Events

### Client → Server

- `room:join` - Join room
- `room:leave` - Leave room
- `player:action` - Submit player action
- `turn:process` - Request turn processing

### Server → Client

- `room:updated` - Room state changed
- `player:joined` - Player joined
- `player:left` - Player left
- `game:state` - Full game state sync
- `error` - Error occurred

## Testing

```bash
# Unit tests
yarn test

# With coverage
yarn test:coverage

# CI mode
yarn test:ci
```

Tests use Firebase emulators automatically.

## Deployment

### Cloud Run

```bash
# Build
gcloud builds submit --config cloudbuild.yaml

# Deploy
gcloud run deploy daicer-backend \
  --image gcr.io/PROJECT_ID/daicer-backend \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables

Set via Secret Manager:

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `FIREBASE_PRIVATE_KEY`

## Code Quality

- **Linting:** ESLint (Airbnb TypeScript config)
- **Formatting:** Prettier
- **Type Safety:** Strict TypeScript, no `any`
- **Testing:** Jest with 80%+ coverage
- **Standards:**
  - Max function length: 25 lines
  - Max file length: 200 lines
  - Complexity: < 10
  - All exports have JSDoc

## Quality Assurance

```bash
# Run full QA suite (format, lint, typecheck, test with coverage)
yarn qa

# Individual checks
yarn format:check  # ✨ Code formatting
yarn lint:check    # 🔍 Linting (CI mode, 0 warnings)
yarn typecheck     # 🔬 Type checking
yarn test:coverage # 📊 Tests + coverage report
```

All quality gates enforced in CI/CD pipeline.

## License

MIT
