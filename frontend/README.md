# D20 AI Frontend

<div align="center">

![Daicer Logo](public/logo.png)

[![CI](https://github.com/YOUR_USERNAME/daicer/workflows/CI/badge.svg)](https://github.com/YOUR_USERNAME/daicer/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]()
[![Code Style](https://img.shields.io/badge/code%20style-airbnb-ff5a5f)](https://github.com/airbnb/javascript)

</div>

React + TypeScript + Vite frontend for multiplayer D&D game.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Firebase Auth** - Authentication
- **Socket.io Client** - Real-time updates

## Project Structure

```
frontend/
├── src/
│   ├── pages/           # Route pages
│   ├── components/      # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API, Socket, Firebase clients
│   ├── types/          # TypeScript types
│   └── main.tsx        # Entry point
├── App.tsx             # Root component with routing
├── package.json
└── vite.config.ts
```

## Development

```bash
# Install dependencies
yarn install

# Start dev server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Environment Variables

Create `.env.local` in project root (not frontend/):

```env
VITE_USE_EMULATORS=true
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_API_URL=http://localhost:3001
```

## Routes

- `/` - Landing/Login
- `/lobby` - Create or join rooms
- `/create` - World settings form
- `/room/:id` - Game room (character creation → gameplay)

## Code Standards

- TypeScript strict mode
- ESLint (Airbnb config)
- Prettier formatting
- Max function length: 25 lines
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
