# Command Reference

Complete reference of all available commands in the Daicer monorepo.

## Quick Start

```bash
# From project root
yarn install:all        # Install all dependencies
yarn dev               # Start everything (emulators, backend, frontend)
yarn storybook         # View component library
yarn test              # Run all tests
yarn qa                # Full quality assurance check
```

## Development Commands

### Start Services

```bash
# All services together
yarn dev                    # Emulators + Backend + Frontend
yarn start                  # Production mode (Backend + Frontend)

# Individual services
yarn dev:emulators         # Firebase emulators only
yarn dev:backend           # Backend server only
yarn dev:frontend          # Frontend dev server only

# Or from subdirectories
cd backend && yarn dev
cd frontend && yarn dev
```

### Build

```bash
# Build everything
yarn build                  # Frontend + Backend

# Build individually
yarn build:frontend        # Build frontend for production
yarn build:backend         # Compile TypeScript backend

# From subdirectories
cd frontend && yarn build
cd backend && yarn build
```

## Testing Commands

### Run Tests

```bash
# All tests (both frontend and backend)
yarn test                  # Run all tests once
yarn test:watch            # Watch mode (both projects)
yarn test:coverage         # With coverage reports
yarn test:ci               # CI mode with coverage

# Frontend only
yarn test:frontend         # Quick test run
yarn test:watch:frontend   # Watch mode
yarn test:coverage:frontend # With coverage
yarn test:ci:frontend      # CI mode
yarn test:ui:frontend      # Interactive UI mode

# Backend only
yarn test:backend          # Quick test run
yarn test:watch:backend    # Watch mode
yarn test:coverage:backend # With coverage
yarn test:ci:backend       # CI mode
yarn test:ui:backend       # Redirects to watch mode

# From subdirectories
cd frontend && yarn test
cd backend && yarn test
```

### View Coverage

```bash
# After running test:coverage
open frontend/coverage/index.html
open backend/coverage/index.html
```

## Storybook (Frontend Component Library)

```bash
# Start Storybook dev server
yarn storybook             # From root
cd frontend && yarn storybook  # From frontend

# Build static Storybook
yarn storybook:build       # From root
cd frontend && yarn storybook:build

# Preview built Storybook
yarn storybook:preview     # From root (serves on port 6007)
```

## Code Quality

### Linting

```bash
# Lint everything
yarn lint                  # Check all files
yarn lint:fix              # Auto-fix issues
yarn lint:check            # CI mode (fail on warnings)

# Frontend only
yarn lint:frontend
yarn lint:fix:frontend
yarn lint:check:frontend

# Backend only
yarn lint:backend
yarn lint:fix:backend
yarn lint:check:backend

# From subdirectories
cd frontend && yarn lint:fix
cd backend && yarn lint:fix
```

### Formatting

```bash
# Format all files
yarn format                # Auto-format everything
yarn format:check          # Check only (CI mode)

# From subdirectories
cd frontend && yarn format
cd backend && yarn format
```

### Type Checking

```bash
# Type check everything
yarn typecheck             # Frontend + Backend

# Individual projects
yarn typecheck:frontend
yarn typecheck:backend

# From subdirectories
cd frontend && yarn typecheck
cd backend && yarn typecheck
```

### Quality Assurance (QA)

Complete quality check with all tools:

```bash
# Full QA (format, lint, typecheck, test with coverage)
yarn qa                    # Both projects
yarn qa:frontend           # Frontend only
yarn qa:backend            # Backend only
```

**QA runs:**

1. Format all code
2. Fix linting issues
3. Type check
4. Run tests with coverage
5. Generate reports in `frontend/coverage/` and `backend/coverage/`
6. Save logs: `format.log`, `lint.log`, `typecheck.log`, `test.log`

## Database & Seeding

```bash
# Firebase emulators
yarn emulators             # Start with import/export

# Seed data
yarn seed                  # Run all seeders
yarn seed:gamedata         # Seed game data only
yarn seed:srd              # Seed SRD rules only
```

## Docker

```bash
yarn docker:build          # Build containers
yarn docker:up             # Start containers
yarn docker:down           # Stop containers
```

## Installation

```bash
yarn install:all           # Install root + frontend + backend deps
```

## File Headers

```bash
# Add standardized headers to all files
node scripts/add-file-headers.js

# Add to specific directory
node scripts/add-file-headers.js frontend/src/components
node scripts/add-file-headers.js backend/src
```

## Command Symmetry

All commands are mirrored between frontend and backend:

| Command         | Frontend | Backend | Root (Both) |
| --------------- | -------- | ------- | ----------- |
| `dev`           | ✅       | ✅      | ✅          |
| `build`         | ✅       | ✅      | ✅          |
| `start`         | ✅       | ✅      | ✅          |
| `lint`          | ✅       | ✅      | ✅          |
| `lint:fix`      | ✅       | ✅      | ✅          |
| `lint:check`    | ✅       | ✅      | ✅          |
| `format`        | ✅       | ✅      | ✅          |
| `format:check`  | ✅       | ✅      | ✅          |
| `typecheck`     | ✅       | ✅      | ✅          |
| `test`          | ✅       | ✅      | ✅          |
| `test:watch`    | ✅       | ✅      | ✅          |
| `test:coverage` | ✅       | ✅      | ✅          |
| `test:ci`       | ✅       | ✅      | ✅          |
| `test:ui`       | ✅       | ✅\*    | ✅          |

\*Backend `test:ui` redirects to `test:watch` (Jest doesn't have UI mode)

## Workflow Examples

### Starting Development

```bash
# Terminal 1: Start everything
yarn dev

# Terminal 2: View components
yarn storybook

# Terminal 3: Run tests in watch mode
yarn test:watch
```

### Before Committing

```bash
# Run full QA check
yarn qa

# Or step by step
yarn format
yarn lint:fix
yarn typecheck
yarn test:coverage
```

### Frontend Development Only

```bash
cd frontend
yarn dev              # Start dev server
yarn test:watch       # Tests in watch mode
yarn storybook        # Component library
```

### Backend Development Only

```bash
cd backend
yarn dev              # Start server
yarn test:watch       # Tests in watch mode
```

### Running Tests

```bash
# Quick test run
yarn test

# Watch mode (auto-rerun on changes)
yarn test:watch

# With coverage reports
yarn test:coverage

# Interactive UI (frontend only)
yarn test:ui
```

### Building for Production

```bash
yarn build            # Build everything
yarn start            # Run production build
```

## Tips

1. **Always from root**: Most commands can be run from root and will handle both projects
2. **Scoped execution**: Add `:frontend` or `:backend` to run on specific project
3. **Coverage reports**: Generated in `frontend/coverage/` and `backend/coverage/`
4. **Log files**: QA command saves logs for review (`*.log` files in root)
5. **Storybook**: Only available for frontend (component documentation)
6. **Test UI**: Vitest has interactive UI, Jest uses watch mode

## Environment Variables

See `.env.example` files in backend/frontend for configuration.

## Troubleshooting

```bash
# Clean install
rm -rf node_modules frontend/node_modules backend/node_modules
yarn install:all

# Clear coverage
rm -rf frontend/coverage backend/coverage

# Clear build artifacts
rm -rf frontend/dist backend/dist

# Reset emulator data
rm -rf emulator-data
yarn dev:emulators
```

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guide
- [FILE_HEADER_STANDARD.md](./FILE_HEADER_STANDARD.md) - File header format
- [frontend/src/components/ui/README.md](./frontend/src/components/ui/README.md) - UI components
- [frontend/src/components/combat/README.md](./frontend/src/components/combat/README.md) - Combat system
- [frontend/src/components/game/README.md](./frontend/src/components/game/README.md) - Game components
