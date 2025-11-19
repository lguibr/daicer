# End-to-End Integration Tests

**Full-stack integration tests for DAIcer** (Frontend + Backend + Database)

## Architecture

E2E tests live at **repository root** (`/e2e/`) because they test the entire system:

- ✅ Frontend React app (port 3000)
- ✅ Backend Express/Socket.io (port 3001)
- ✅ Firebase emulators (Firestore + Auth)
- ✅ Real-time WebSocket communication
- ✅ Database state persistence

## Structure

```
/e2e/
├── package.json           # E2E-specific dependencies
├── playwright.config.ts   # Playwright configuration
├── *.spec.ts             # Test suites
├── utils/
│   ├── helpers.ts        # Test utilities
│   └── emulator.ts       # Firebase emulator helpers
├── playwright-report/    # Test reports
└── test-results/         # Test artifacts
```

## Running Tests

```bash
# From repository root
cd e2e

# Install dependencies (first time)
yarn install

# Run all tests
yarn test

# Run with UI mode (recommended for development)
yarn test:ui

# Run in headed mode (see browser)
yarn test:headed

# Debug specific test
yarn test:debug auth.spec.ts

# View last test report
yarn report
```

## Prerequisites

**Both services must be running:**

```bash
# Terminal 1: Frontend
cd frontend && yarn dev

# Terminal 2: Backend
cd backend && yarn dev

# Terminal 3: E2E tests
cd e2e && yarn test
```

## Test Suites

- `auth.spec.ts` - Authentication flows
- `room-creation.spec.ts` - Room creation & settings
- `character-creation.spec.ts` - Character builder
- `gameplay.spec.ts` - Basic gameplay loop
- `gameplay-turns.spec.ts` - Turn processing mechanics
- `integration-flow.spec.ts` - Complete 5-turn game flow
- `realtime-events.spec.ts` - WebSocket events
- `i18n.spec.ts` - Internationalization
- `langgraph-studio.spec.ts` - LangGraph Studio MCP server integration

## LangGraph Studio Integration

DAICE exposes graphs, tools, prompts, and agents via an MCP (Model Context Protocol) server for use with **LangGraph Studio** - a local desktop IDE for drafting and editing LangGraph agents.

### Running the Studio Server

```bash
# Terminal 1: Start the Studio MCP server (port 3002)
cd backend && yarn studio

# Terminal 2: Run Studio tests
cd e2e && yarn test langgraph-studio.spec.ts
```

### Connecting LangGraph Studio Desktop App

1. Download LangGraph Studio from [LangChain](https://www.langchain.com/langgraph-studio)
2. Start the MCP server: `cd backend && yarn studio`
3. In LangGraph Studio, connect to: `http://localhost:3002`
4. You'll see:
   - **Graphs**: `gameplay`, `character-creation`
   - **Tools**: All D&D 5e tools (dice rolls, attacks, spells, etc.)
   - **Prompts**: DM narrative templates, character creation prompts
   - **Agents**: DM agent, player agents, tactical combat agents

### Available MCP Endpoints

The Studio server exposes:

**Graphs:**

- `GET /mcp/graphs` - List all graphs
- `GET /mcp/graphs/:graphId/schema` - Get graph state schema
- `POST /mcp/graphs/:graphId/invoke` - Execute graph synchronously
- `POST /mcp/graphs/:graphId/stream` - Execute graph with streaming
- `GET /mcp/graphs/:graphId/state/:threadId` - Get graph state by thread

**Registries:**

- `GET /mcp/registry/tools` - List all tools
- `GET /mcp/registry/tools/:id` - Get tool by ID
- `GET /mcp/registry/tools/category/:category` - Filter tools by category
- `GET /mcp/registry/tools/agent/:agentId` - Get tools for specific agent
- `GET /mcp/registry/prompts` - List all prompts
- `GET /mcp/registry/prompts/:id` - Get prompt by ID
- `GET /mcp/registry/prompts/category/:category` - Filter prompts by category
- `GET /mcp/registry/agents` - List all agents
- `GET /mcp/registry/agents/:id` - Get agent by ID
- `GET /mcp/registry/agents/role/:role` - Filter agents by role

### Workflow: Draft → Export → Work

1. **Draft** agents and graphs in LangGraph Studio using the MCP endpoints
2. **Export** graph definitions from Studio
3. **Work** on them locally by importing into `backend/src/graph/`
4. **Test** changes by running the Studio server and connecting again

### Environment Variables

For tracing graph executions in LangSmith (web-based trace viewer):

```bash
# backend/.env.local
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_key_here
LANGSMITH_PROJECT=daicer-dev
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

View traces at: https://smith.langchain.com

## Why Root Level?

E2E tests are **system-level integration tests**:

- Test frontend + backend + database together
- Not unit tests (those live in `/frontend/src/**/__tests__/` and `/backend/src/**/__tests__/`)
- Require both services running
- Use Playwright to drive browser automation
- Verify full user journeys across the stack

Moving them to root makes the architecture clearer and separates concerns properly.
