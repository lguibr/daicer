# Daicer Backend

<p align="center">
  <img src="../frontend/public/logo.png" alt="Daicer logo" width="220" />
</p>

<p align="center">
  <a href="https://github.com/lguibr/daice/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://img.shields.io/github/actions/workflow/status/lguibr/daice/ci.yml?label=CI&logo=github" alt="CI status"></a>
  <a href="https://github.com/lguibr/daice/releases"><img src="https://img.shields.io/github/v/release/lguibr/daice?display_name=tag&logo=semanticweb" alt="Release tag"></a>
  <img src="https://img.shields.io/badge/tests-Jest-blue?logo=jest" alt="Jest">
  <img src="https://img.shields.io/badge/coverage-%E2%89%A580%25-brightgreen?logo=codecov" alt="Coverage">
  <img src="https://img.shields.io/badge/lint-ESLint-4b32c3?logo=eslint" alt="ESLint">
  <img src="https://img.shields.io/badge/format-Prettier-ff69b4?logo=prettier" alt="Prettier">
  <img src="https://img.shields.io/badge/deploy-Cloud%20Run-4285f4?logo=googlecloud" alt="Cloud Run">
  <img src="https://img.shields.io/badge/seeds-Cloud%20Build-34a853?logo=googlecloud" alt="Seeds via Cloud Build">
</p>

Purpose-built orchestration layer for the AI Dungeon Master: REST + WebSocket APIs, LangGraph-tuned services, and Firebase persistence.

---

## TL;DR

- Express + Socket.IO server running on Node.js 22 with strict TypeScript and zero `any`.
- Persists narrative, combat, and asset state to Firestore and Storage via Firebase Admin SDK.
- Delegates AI-heavy work to LangChain / LangGraph services with deterministic dice rolls and audit trails.
- Ships with emulator-first workflows, reproducible Cloud Run deployments, and CI-enforced QA gates.

---

## Module Map

```text
backend/
├── src/
│   ├── api/          HTTP controllers (RESTful surface)
│   ├── services/     Business logic: game engine, Firestore, LLM, assets
│   ├── socket/       Real-time combat + narrative events
│   ├── middleware/   Auth, validation, error shaping
│   ├── utils/        Shared helpers (logging, dice, responses)
│   ├── types/        Domain models (spells, combat graph, payloads)
│   ├── config/       Firebase + LangChain configuration
│   ├── server.ts     Express + Socket boot strap
│   └── ...           Tests, scripts, generators
├── jest.config.js
├── Dockerfile
└── cloudbuild.yaml
```

Cross-links:

- API design: `src/api/README.md`
- Socket design: `src/socket/README.md`
- Service orchestration: `src/services/README.md`
- Middleware contracts: `src/middleware/README.md`
- Spell system types: `src/types/README-SPELLS.md`

---

## Architecture Overview

```mermaid
flowchart LR
    Browser[Frontend\nReact/Vite] -->|HTTPS| REST[Express API]
    Browser -->|WebSocket| WS[Socket.IO Gateway]

    REST -->|Firebase Admin| Firestore[(Firestore)]
    REST -->|Firebase Admin| Auth[(Auth)]
    REST --> Services[Services Layer]

    WS --> SocketHandlers[Socket Handlers]
    SocketHandlers --> Services

    Services -->|Graph Exec| LangGraph[LangGraph Engine]
    LangGraph -->|Tool Calls| Dice[Deterministic Dice]
    LangGraph -->|LLM Calls| LangChain[LangChain Client]

    LangChain --> Gemini
    LangChain --> OpenAI
    LangChain --> Anthropic
```

Key traits:

- **Stateless containers**: Everything needed to rebuild state lives in Firestore and LangGraph checkpoints.
- **Deterministic combat**: Dice rolls seeded per encounter for replay & time-travel.
- **Observability baked in**: Structured logging with request correlation IDs and per-turn traces.

---

## Getting Started (Local)

1. Install workspace dependencies from repository root:

   ```bash
   yarn install:all
   ```

2. Copy environment templates (root + backend):

   ```bash
   cp .env.example .env.local
   cp backend/.env.example backend/.env.local
   ```

3. Populate `backend/.env.local`:

   ```env
   GEMINI_API_KEY=your-gemini-key
   FIREBASE_PROJECT_ID=daicer-dev
   FIREBASE_STORAGE_BUCKET=daicer-dev.appspot.com
   STORAGE_EMULATOR_HOST=http://127.0.0.1:9199
   OPENAI_API_KEY=optional
   ANTHROPIC_API_KEY=optional
   ```

4. Launch the full stack (from repo root):

   ```bash
   yarn dev
   ```

   - Spins up Firebase emulators, backend watcher (port `3001`), and frontend dev server.

5. Alternative targeted workflows:

   ```bash
   yarn emulators           # Firebase only
   yarn dev:backend         # Backend only
   yarn test backend        # Jest in watch mode
   yarn storybook           # UI component catalog
   ```

Docker users:

```bash
docker-compose up backend   # Backend + emulators
docker-compose up           # Full stack
```

---

## Runtime Responsibilities

| Capability              | Where                                    | Notes                                                   |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------- |
| REST endpoints          | `src/api`                                | Rooms, game lifecycle, asset generation, health checks  |
| WebSocket events        | `src/socket`                             | Real-time room state, combat progression, notifications |
| LangGraph orchestration | `src/services/game.ts`                   | Manages turn graph, tool execution, time travel         |
| Firestore access        | `src/services/firestore.ts`              | Emulator-aware, batched writes, optimistic concurrency  |
| Asset pipelines         | `src/services/asset-*.ts`                | Streams prompts to Gemini, stores outputs to Storage    |
| Spell + combat math     | `src/combat/*.ts`, `src/types/spells.ts` | Grid calculations, targeting, deterministic dice        |

---

## Key Scripts

| Command                       | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `yarn dev`                    | Start backend in watch mode (requires emulators)   |
| `yarn build`                  | Compile TypeScript to `dist/`                      |
| `yarn start`                  | Run compiled server (production)                   |
| `yarn test`                   | Jest unit/integration suite (auto spins emulators) |
| `yarn test:coverage`          | Jest with Istanbul coverage                        |
| `yarn test:ci`                | Headless CI run (fail on warnings)                 |
| `yarn lint` / `yarn lint:fix` | ESLint with Airbnb/TypeScript rules                |
| `yarn format`                 | Prettier write                                     |
| `yarn typecheck`              | `tsc --noEmit` safety net                          |

---

## Environment & Configuration

- **Firebase emulators** (default): Firestore on `localhost:8080`, Auth on `9099`, Storage on `9199`.
- **Service account**: Emulator mode uses `firebase-admin` without credentials; production injects service account via Secret Manager.
- **LangChain providers**: Keys pulled from env; configure provider priority in `src/config/langchain.ts`.
- **CORS**: Locked to `http://localhost:3000` in dev, environment variable driven in production.
- **Rate limiting**: Apply per-route via `express-rate-limit` (see `src/middleware/README.md`).

---

## Testing & QA

```bash
# Backend unit + integration suites
yarn test backend

# Spell targeting golden tests
yarn test backend/src/combat/__tests__/spell-targeting.test.ts

# Full QA (lint + format + typecheck + tests)
yarn qa
```

Testing layers:

- **Unit**: Utilities, services, reducers (Vitest-style assertions via Jest).
- **Integration**: API + socket flows with Firebase emulators.
- **Snapshots**: Combat spell geometries, LangGraph node transitions.
- **Regression**: Coverage enforced at ≥80% statements/branches.

---

## Observability & Ops

- **Logging**: `src/utils/logger.ts` configures Winston; emits JSON with request IDs and spans.
- **Tracing**: LangGraph runs annotate each node with duration + tool calls (persisted in Firestore `turn_history`).
- **Error shaping**: `src/middleware/error.ts` standardizes responses + hides stack traces in production.
- **Health**: `GET /health` tests Firestore and LangGraph readiness.
- **Metrics**: TODO — integrate OpenTelemetry (tracked in roadmap).

---

## Deployment (Cloud Run)

### Automated Release Flow

Tags prefixed with `v` (e.g., `v1.2.3`) trigger `release.yml`:

- Builds backend via Cloud Build using `backend/cloudbuild.yaml`.
- Deploys Cloud Run service `daicer-backend` in `us-central1`.
- Runs Firestore seeds by invoking `seeds/cloudbuild.seed.yaml`.
- Notifies Vercel to promote the latest frontend build.

### Manual Commands

```bash
gcloud builds submit --config cloudbuild.yaml
gcloud run deploy daicer-backend \
  --image gcr.io/<PROJECT_ID>/daicer-backend \
  --region us-central1 \
  --allow-unauthenticated
```

Configure environment:

- Secrets: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `FIREBASE_PRIVATE_KEY`.
- Vars: `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `LOG_LEVEL`, `ALLOWED_ORIGINS`.
- Minimum instances: `1`, concurrency: `80`.

Post-deploy:

- Smoke test with `yarn test:e2e`.
- Verify Firestore indexes (`firestore.indexes.json`).
- Review Cloud Logging for errors.

---

## Contributing Checklist

1. Add/adjust tests beside the module (`*.spec.ts`).
2. Run `yarn qa backend`.
3. Update relevant README(s) if behavior or contracts change.
4. Provide migration notes for deployments (Firestore indexes, env vars).

Refer to `CONTRIBUTING.md` for repo-wide expectations.

---

## Troubleshooting

| Symptom                          | Likely Cause                    | Fix                                                         |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `UNAUTHENTICATED` responses      | Missing Firebase auth header    | Ensure frontend sends `Authorization: Bearer <token>`       |
| `Firestore emulator not running` | Forgot `yarn emulators`         | Start emulators or set `USE_EMULATORS=false`                |
| LangGraph node hang              | Gemini rate-limits              | Provide API key, enable fallback providers                  |
| Socket replay loop               | Client not acknowledging events | Inspect `socket/handlers.ts` and confirm idempotent reducer |

---

## Further Reading

- `src/services/README.md` — detailed LangGraph + Firestore orchestration.
- `docs/graphs/` — Mermaid diagrams for combat/narrative flows.
- `seeds/` — data population scripts for spells and SRD content.
- Root `README.md` — project-wide overview with frontend context.

---

MIT License.
