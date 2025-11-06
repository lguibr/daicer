# Services

Business logic layer for D20 AI backend.

## Architecture

```mermaid
graph TB
    API[API Layer] --> Services[Services Layer]
    Socket[Socket Handlers] --> Services
    
    Services --> FS[Firestore Service]
    Services --> LLM[LLM Service]
    Services --> Game[Game Service]
    
    FS --> Firestore[(Firestore)]
    LLM --> LC[LangChain]
    LC --> Gemini
    LC --> OpenAI
    LC --> Anthropic
    
    Game --> LLM
    Game --> FS
```

## Files

- `firestore.ts` - Firestore database operations
- `llm.ts` - LLM integration via LangChain
- `game.ts` - Game logic (world gen, turn processing, DM AI)

## Service Pattern

Each service:
1. Exports pure functions
2. Has comprehensive JSDoc
3. Handles errors gracefully
4. Logs all operations
5. Returns typed responses

## Testing

Services are fully testable with:
- Firebase emulators
- LLM mocks
- Dependency injection

