# Tactical Combat System Documentation

## Overview

Natural language tactical combat system for D&D 5e with AI-powered command parsing, rule validation, and action preview/execution.

## Architecture

### Backend Components

```
backend/src/tactical/
├── types/
│   ├── arena.ts         - Arena, GridCell, TerrainType definitions
│   └── unit.ts          - TacticalUnit, TacticalEncounter types
├── arenas/
│   └── generator.ts     - 5 pre-built tactical arenas
├── services/
│   ├── gridManager.ts   - Pathfinding (A*), LOS (Bresenham), movement costs
│   ├── actionPlanner.ts - D&D 5e rule validation (range, LOS, resources)
│   └── contextBuilder.ts - RAG context for LLM (rules, units, history)
├── llm/
│   └── commandParser.ts - Natural language → structured commands (Gemini)
└── api/
    ├── units.ts         - Encounter/unit CRUD endpoints
    └── actions.ts       - Preview & execution endpoints
```

### Frontend Components

```
frontend/src/
├── services/
│   └── tacticalApi.ts           - API client
├── hooks/
│   ├── useTacticalEncounter.ts  - Encounter state management
│   └── useTacticalActions.ts    - Command handling
├── components/tactical/
│   ├── types.ts                 - Shared type definitions
│   ├── UnitCard.tsx             - Individual unit display
│   ├── UnitRoster.tsx           - Unit list sidebar
│   ├── ArenaSelector.tsx        - Arena picker (SpotlightCarousel)
│   ├── CommandInput.tsx         - Natural language input
│   ├── TacticalLog.tsx          - Combat log
│   ├── ActionPreviewModal.tsx   - Action preview UI
│   └── TacticalArena.tsx        - Grid rendering
└── pages/
    └── TacticalCombat.tsx       - Main page
```

## Key Features

### 1. Natural Language Commands

**Examples:**

- "Gandalf moves to (5,3) and casts fireball"
- "Orc attacks nearest player"
- "Wizard takes dodge action"

**Flow:**

1. User types command → `CommandInput`
2. Submitted to `/api/tactical/encounter/:id/preview`
3. LLM parses with structured output (Zod schema)
4. RAG fetches relevant D&D rules
5. Action planner validates rules
6. Preview shown with predictions

### 2. Rule Validation

**Checks:**

- ✅ Range (Manhattan distance for melee, Euclidean for ranged)
- ✅ Line of sight (Bresenham algorithm)
- ✅ Movement costs (terrain-based)
- ✅ Action economy (has action/movement remaining)
- ✅ Friendly fire warnings

**Example Validations:**

```typescript
// Range check
const distance = gridManager.getManhattanDistance(actor.position, target.position);
const inRange = distance <= actor.reach;

// LOS check
const hasLOS = gridManager.hasLineOfSight(actor.position, target.position);

// Movement cost
const path = gridManager.findPath(start, end, movementBudget);
const cost = gridManager.calculatePathCost(path);
```

### 3. Action Preview

**Predictions:**

- Hit chance (based on attack bonus vs AC)
- Damage range (min/max/avg)
- Movement path
- Affected units

**Example Preview Response:**

```json
{
  "planId": "plan-123",
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": ["Target has heavy cover (+5 AC)"]
  },
  "preview": {
    "movementPath": [
      { "x": 3, "y": 4 },
      { "x": 4, "y": 4 },
      { "x": 5, "y": 4 }
    ],
    "hitChance": 0.65,
    "diceNeeded": ["1d20+5 attack", "1d8+3 damage"],
    "affectedUnits": [
      {
        "unitId": "orc-1",
        "effect": "65% chance to hit",
        "predictedDamage": { "min": 4, "max": 11, "avg": 7 }
      }
    ]
  }
}
```

### 4. Tactical Arenas

**5 Pre-built Arenas:**

1. **Tavern Brawl** (15x12) - Tables, bar cover
2. **Dungeon Corridor** (20x10) - Long hallway with pillars
3. **Forest Clearing** (18x18) - Trees, undergrowth
4. **Ruined Castle** (20x20) - Broken walls, elevated platforms
5. **Open Arena** (16x16) - Minimal obstacles

**Terrain Types:**

- `open` - Normal movement
- `difficult_terrain` - 2x movement cost
- `light_cover` - +2 AC
- `heavy_cover` - +5 AC
- `wall` - Impassable, blocks LOS
- `chasm` - Impassable
- `elevated` - Height advantage

## API Endpoints

### Arena Management

```
GET /api/tactical/arenas
```

List all available arenas.

### Encounter Management

```
POST /api/tactical/encounter
Body: { arenaId: string, name: string }
```

Create new encounter.

```
GET /api/tactical/encounter/:id
```

Get encounter state.

### Unit Management

```
POST /api/tactical/encounter/:id/units
Body: {
  type: 'character' | 'creature',
  characterId?: string,
  creatureId?: string,
  position: { x: number, y: number }
}
```

Add unit to encounter.

```
DELETE /api/tactical/encounter/:id/units/:unitId
```

Remove unit from encounter.

```
POST /api/tactical/encounter/:id/start
```

Start combat (roll initiative).

### Action System

```
POST /api/tactical/encounter/:id/preview
Body: { command: string }
```

Preview action with predictions.

```
POST /api/tactical/encounter/:id/execute
Body: {
  planId: string,
  confirmed: boolean,
  overrides?: { allowFriendlyFire?: boolean }
}
```

Execute previewed action.

## Command Examples

### Movement

- "Warrior moves to (7,5)"
- "Ranger moves 3 squares north"
- "Gandalf walks to the corner"

### Attacks

- "Barbarian attacks Goblin"
- "Wizard attacks nearest enemy"
- "Fighter uses longsword on Orc"

### Spells

- "Cleric casts healing word on Fighter"
- "Wizard casts fireball at (10,10)"
- "Druid uses entangle in the center"

### Actions

- "Rogue takes dodge action"
- "Monk uses dash"
- "Paladin helps Fighter"

## Integration Notes

### Current Status

- ✅ Fully functional 2D tactical combat
- ✅ LLM command parsing with RAG
- ✅ D&D 5e rule validation
- ✅ Action preview with predictions
- ❌ Not yet integrated with 3D map generation
- ❌ Not using shared grid renderer

### Future Integration (See TACTICAL_INTEGRATION_TODO.md)

1. Unify grid rendering with CombatGrid
2. Add 3D rendering with Three.js
3. Generate arenas from procedural maps
4. 3D character models and spell effects

## Testing

Currently no automated tests. Manual testing checklist:

- [ ] Create encounter
- [ ] Add player and enemy units
- [ ] Start combat (initiative rolls)
- [ ] Submit natural language command
- [ ] Preview shows predictions
- [ ] Execute action
- [ ] Combat log updates
- [ ] Unit HP changes
- [ ] Next turn advances

## Development

### Adding New Arena

```typescript
// backend/src/tactical/arenas/generator.ts
export const generateMyArena = (): TacticalArena => {
  const gridWidth = 20;
  const gridHeight = 15;
  const cells = createEmptyGrid(gridWidth, gridHeight);

  // Add terrain features
  setTerrain(cells, [{ x: 5, y: 5 }], TerrainType.WALL);

  return {
    id: uuidv4(),
    name: 'My Arena',
    description: '...',
    gridWidth,
    gridHeight,
    cells,
  };
};
```

### Adding New Command Intent

```typescript
// backend/src/tactical/llm/commandParser.ts
export const ParsedCommandSchema = z.object({
  intent: z.enum([
    'move',
    'attack',
    'cast_spell',
    'my_new_intent', // Add here
  ]),
  // ...
});

// backend/src/tactical/services/actionPlanner.ts
switch (parsed.intent) {
  case 'my_new_intent':
    // Handle new intent
    break;
}
```

## Performance

- Grid pathfinding: O(n log n) with A\*
- LOS checks: O(distance) with Bresenham
- LLM parsing: ~1-2s per command
- Action preview: <100ms
- Action execution: <50ms

## Dependencies

**Backend:**

- LangChain + Gemini for LLM
- Firestore Vector Search for RAG
- Zod for schema validation
- Express for API

**Frontend:**

- React + TypeScript
- React Router for navigation
- Lucide icons
- Tailwind CSS
- Custom UI components

## Access

**Route:** `/tactical` (authenticated)

**Entry Points:**

- Lobby page (Tactical Combat Arena card)
- Direct navigation from any page

---

Built with composable architecture - all files <200 lines, clean separation of concerns.
