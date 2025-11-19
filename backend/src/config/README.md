# Configuration Layer

Centralized initialization and configuration for Firebase Admin SDK, LangChain providers, and OpenAPI documentation generation.

---

## Overview

```mermaid
flowchart LR
    ENV[Environment Variables] --> Firebase[firebase.ts]
    ENV --> LangChain[langchain.ts]
    ENV --> OpenAPI[openapi.ts]

    Firebase --> Admin[Firebase Admin SDK]
    Admin --> Firestore[(Firestore)]
    Admin --> Auth[(Firebase Auth)]
    Admin --> Storage[(Cloud Storage)]

    LangChain --> Gemini[Gemini Flash/Pro]
    LangChain --> OpenAI[OpenAI GPT-4]
    LangChain --> Anthropic[Claude Sonnet]

    OpenAPI --> SwaggerUI[Swagger UI]
    OpenAPI --> Spec[OpenAPI JSON/YAML]
```

---

## Module Structure

```
config/
├── firebase.ts      Firebase Admin SDK initialization (emulator-aware)
├── langchain.ts     LangChain model factory with provider fallbacks
└── openapi.ts       OpenAPI/Swagger documentation config
```

---

## Firebase Configuration (`firebase.ts`)

Initializes Firebase Admin SDK with automatic emulator detection for development.

### Environment-Aware Initialization

```typescript
import { initializeFirebase, db, auth, storage } from '@/config/firebase';

// Call once at server startup
initializeFirebase();

// Then use exported instances
const roomRef = db.collection('rooms').doc(roomId);
const user = await auth.getUser(userId);
const file = storage.bucket().file('avatars/123.png');
```

### Emulator Detection

Automatically connects to Firebase emulators in development/test:

```typescript
export function initializeFirebase(): void {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  if (isDevelopment) {
    // Use emulators
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
      storageBucket: `${projectId}.appspot.com`,
    });

    // Emulator hosts set via environment variables:
    // - FIRESTORE_EMULATOR_HOST=localhost:8080
    // - FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
    // - STORAGE_EMULATOR_HOST=http://127.0.0.1:9199
  } else {
    // Production: use service account
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
}
```

### Exported Instances

```typescript
// Firestore
export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// Auth
export const auth = getAuth();

// Storage
export const storage = getStorage();
export const bucket = storage.bucket();
```

### Environment Variables

**Development (emulators):**

```env
NODE_ENV=development
FIREBASE_PROJECT_ID=daicer-dev
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
STORAGE_EMULATOR_HOST=http://127.0.0.1:9199
```

**Production:**

```env
NODE_ENV=production
FIREBASE_PROJECT_ID=daicer-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@daicer-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=daicer-prod.appspot.com
```

### Testing

```typescript
import { db } from '@/config/firebase';

describe('Firestore operations', () => {
  beforeAll(() => {
    // Emulators started via setup-emulators.ts
  });

  it('writes to emulator', async () => {
    await db.collection('test').doc('123').set({ foo: 'bar' });
    const doc = await db.collection('test').doc('123').get();
    expect(doc.data()).toEqual({ foo: 'bar' });
  });
});
```

---

## LangChain Configuration (`langchain.ts`)

Factory for creating LangChain chat models with provider fallbacks and streaming support.

### Model Factory

```typescript
import { getChatModel } from '@/config/langchain';

// Get default model (Gemini Flash)
const model = getChatModel();

// Specify model
const gpt4 = getChatModel({ modelName: 'gpt-4o-mini' });
const claude = getChatModel({ modelName: 'claude-3-5-sonnet-20241022' });

// With options
const geminiPro = getChatModel({
  modelName: 'gemini-2.0-flash-exp',
  temperature: 0.9,
  maxTokens: 4096,
  streaming: true,
});
```

### Supported Providers

| Provider  | Models                                                                        | API Key Env Var     | Notes                                  |
| --------- | ----------------------------------------------------------------------------- | ------------------- | -------------------------------------- |
| Google    | `gemini-2.0-flash-exp`<br>`gemini-2.0-flash-thinking-exp`<br>`gemini-1.5-pro` | `GEMINI_API_KEY`    | Default provider, fastest, best vision |
| OpenAI    | `gpt-4o`<br>`gpt-4o-mini`<br>`o1-mini`                                        | `OPENAI_API_KEY`    | Fallback for complex reasoning         |
| Anthropic | `claude-3-5-sonnet-20241022`<br>`claude-3-5-haiku-20241022`                   | `ANTHROPIC_API_KEY` | Fallback for long context              |

### Provider Selection Logic

```typescript
export function getChatModel(options?: ChatModelOptions): ChatModel {
  const provider = detectAvailableProvider();

  if (provider === 'google' && process.env.GEMINI_API_KEY) {
    return new ChatGoogleGenerativeAI({
      modelName: options?.modelName || 'gemini-2.0-flash-exp',
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens,
    });
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      modelName: options?.modelName || 'gpt-4o-mini',
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens,
    });
  }

  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({
      modelName: options?.modelName || 'claude-3-5-sonnet-20241022',
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens,
    });
  }

  throw new Error('No LLM provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY');
}
```

### Streaming Support

```typescript
const model = getChatModel({ streaming: true });

const stream = await model.stream([
  { role: 'system', content: 'You are a DM' },
  { role: 'user', content: 'Describe a dark forest' },
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### Structured Output

```typescript
import { getChatModel } from '@/config/langchain';
import { TurnResponseSchema } from '@/schemas/agent-responses';

const model = getChatModel();
const structuredModel = model.withStructuredOutput(TurnResponseSchema);

const result = await structuredModel.invoke([{ role: 'user', content: 'Process turn for player Alice' }]);

// Result is typed and validated via Zod
console.log(result.overall_summary);
console.log(result.player_perspectives);
```

### Environment Variables

```env
# Primary provider (required)
GEMINI_API_KEY=your-gemini-api-key

# Fallback providers (optional)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# LangSmith tracing (optional)
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your-langsmith-key
LANGSMITH_PROJECT=daicer-rpg
```

### Model Selection Guidelines

| Use Case          | Recommended Model               | Temperature | Reasoning                            |
| ----------------- | ------------------------------- | ----------- | ------------------------------------ |
| Turn narrative    | `gemini-2.0-flash-exp`          | 0.7         | Fast, creative, good at storytelling |
| Tactical commands | `gemini-2.0-flash-thinking-exp` | 0.3         | Precise, rule-compliant              |
| Complex planning  | `o1-mini`                       | 0.5         | Multi-step reasoning                 |
| Long context      | `claude-3-5-sonnet-20241022`    | 0.7         | 200k token context                   |
| Vision (avatars)  | `gemini-1.5-pro`                | 0.8         | Best multimodal                      |

---

## OpenAPI Configuration (`openapi.ts`)

Configuration for auto-generated OpenAPI 3.0 documentation via `swagger-jsdoc`.

### Swagger UI Access

**Development:**

- Swagger UI: http://localhost:3001/api-docs
- JSON Spec: http://localhost:3001/api-docs/spec
- YAML Spec: http://localhost:3001/api-docs/spec.yaml

**E2E Environment:**

- Swagger UI: http://localhost:3101/api-docs
- JSON Spec: http://localhost:3101/api-docs/spec
- YAML Spec: http://localhost:3101/api-docs/spec.yaml

### Base Configuration

```typescript
import { swaggerSpec } from '@/config/openapi';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'DAICE Backend API',
    version: '1.0.0',
    description: 'AI-powered D&D 5e game engine with LangGraph orchestration',
    contact: {
      name: 'DAICE Team',
      url: 'https://github.com/lguibr/daice',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'http://localhost:3101',
      description: 'E2E test server',
    },
    {
      url: 'https://api.daice.io',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID token',
      },
    },
    schemas: {
      // Reusable schemas
      Room: {
        /* ... */
      },
      Player: {
        /* ... */
      },
      Character: {
        /* ... */
      },
      ApiSuccessResponse: {
        /* ... */
      },
      ApiErrorResponse: {
        /* ... */
      },
    },
    responses: {
      // Reusable responses
      UnauthorizedError: {
        description: 'Missing or invalid authentication token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
          },
        },
      },
      NotFoundError: {
        /* ... */
      },
      ValidationError: {
        /* ... */
      },
      ServerError: {
        /* ... */
      },
    },
  },
};
```

### Documenting Endpoints

Add `@openapi` JSDoc blocks to route handlers:

```typescript
/**
 * @openapi
 * /api/rooms:
 *   post:
 *     summary: Create a new multiplayer room
 *     description: Creates a room with generated code and owner membership
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Epic Adventure"
 *               maxPlayers:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 8
 *                 default: 6
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', authenticate, validate(createRoomSchema), createRoomController);
```

### Tags

Organize endpoints by domain:

- `Health` - Health checks
- `Rooms` - Room lifecycle
- `Game` - Gameplay (world gen, turns, characters)
- `Users` - User profiles
- `Characters` - Character sheets
- `Spells` - Spell catalog
- `Assets` - AI-generated art
- `Equipment` - Items and inventory
- `Tactical` - Tactical combat

### Importing into Postman

1. Open Postman
2. Click **Import** → **Link**
3. Enter: `http://localhost:3001/api-docs/spec`
4. Postman generates a collection

This complements the hand-crafted collection at `postman/daicer-api.postman_collection.json`.

---

## Configuration Best Practices

### 1. Environment-Specific Config

```typescript
const config = {
  firebase: {
    useEmulator: process.env.NODE_ENV !== 'production',
    projectId: process.env.FIREBASE_PROJECT_ID || 'daicer-dev',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'google',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  },
  api: {
    corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimit: {
      windowMs: 60_000,
      max: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
    },
  },
};
```

### 2. Secrets Management

**Development (local `.env.local`):**

```env
GEMINI_API_KEY=your-dev-key
```

**Production (Cloud Run secrets):**

```bash
gcloud secrets create GEMINI_API_KEY --data-file=-
echo "your-prod-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

Mount in Cloud Run:

```yaml
# cloudbuild.yaml
- name: gcr.io/cloud-builders/gcloud
  args:
    - run
    - deploy
    - daicer-backend
    - --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### 3. Validation

Validate config at startup to fail fast:

```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  LANGSMITH_TRACING: z.enum(['true', 'false']).optional(),
});

export function validateConfig() {
  const result = ConfigSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Configuration validation failed:');
    console.error(result.error.format());
    process.exit(1);
  }
}
```

Call in `server.ts`:

```typescript
import { validateConfig } from '@/config/validation';

validateConfig(); // Fail fast if misconfigured
initializeFirebase();
```

---

## Related Documentation

- [[../api/README.md|API Layer]] - How OpenAPI is used for endpoint documentation
- [[../services/README.md|Services Layer]] - How LangChain models are used in services
- [[../../README.md|Backend README]] - Environment setup and deployment
- [[../../.env.example|Environment Template]] - Required environment variables
- [[../../PROJECT_CATALOG.md#configuration|Project Catalog]] - Configuration philosophy

---

Built following [[../../.cursor/rules/README.md|Rule 14: Type is King]] - all config is validated with Zod.
