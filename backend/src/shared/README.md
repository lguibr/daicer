# Shared Utilities

Shared helper functions used across multiple backend modules. Pure, stateless utilities for geometry, spell loadouts, and common calculations.

---

## Modules

```
shared/
├── spell-geometry.ts    Geometric calculations for spell areas of effect
└── spellLoadouts.ts     Pre-configured spell lists by class/level
```

---

## Spell Geometry (`spell-geometry.ts`)

Low-level geometric calculations for D&D 5e spell targeting.

### Core Functions

```typescript
/**
 * Calculate distance between two grid points (Euclidean)
 */
export function getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy) * 5; // Convert grid squares to feet
}

/**
 * Calculate Manhattan distance (grid movement)
 */
export function getManhattanDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  return (Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y)) * 5;
}

/**
 * Check if point is within cone area
 */
export function isInCone(
  point: { x: number; y: number },
  origin: { x: number; y: number },
  direction: { x: number; y: number },
  length: number,
  angleRadians: number
): boolean {
  // Vector from origin to point
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > length / 5) return false; // Outside range

  // Calculate angle between direction and point
  const dotProduct = dx * direction.x + dy * direction.y;
  const magnitudes = distance * Math.sqrt(direction.x ** 2 + direction.y ** 2);
  const angle = Math.acos(dotProduct / magnitudes);

  return Math.abs(angle) <= angleRadians / 2;
}

/**
 * Calculate sphere (circle) area on grid
 */
export function getSphereArea(
  center: { x: number; y: number },
  radiusFeet: number,
  gridWidth: number,
  gridHeight: number
): Array<{ x: number; y: number }> {
  const affected: Array<{ x: number; y: number }> = [];
  const radiusSquares = Math.ceil(radiusFeet / 5);

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const distanceSquares = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);

      if (distanceSquares <= radiusSquares) {
        affected.push({ x, y });
      }
    }
  }

  return affected;
}

/**
 * Calculate line area (Lightning Bolt, etc.)
 */
export function getLineArea(
  origin: { x: number; y: number },
  target: { x: number; y: number },
  lengthFeet: number,
  widthFeet: number
): Array<{ x: number; y: number }> {
  // Bresenham's line algorithm with width
  const affected: Array<{ x: number; y: number }> = [];
  const widthSquares = Math.max(1, Math.floor(widthFeet / 5));

  // ... implementation

  return affected;
}
```

### Helper Functions

```typescript
/**
 * Convert feet to grid squares
 */
export function feetToSquares(feet: number): number {
  return Math.ceil(feet / 5);
}

/**
 * Convert grid squares to feet
 */
export function squaresToFeet(squares: number): number {
  return squares * 5;
}

/**
 * Check if two grid positions are adjacent (orthogonal or diagonal)
 */
export function isAdjacent(pos1: { x: number; y: number }, pos2: { x: number; y: number }): boolean {
  const dx = Math.abs(pos2.x - pos1.x);
  const dy = Math.abs(pos2.y - pos1.y);
  return dx <= 1 && dy <= 1 && dx + dy > 0;
}

/**
 * Get all adjacent positions
 */
export function getAdjacentPositions(
  pos: { x: number; y: number },
  gridWidth: number,
  gridHeight: number
): Array<{ x: number; y: number }> {
  const adjacent: Array<{ x: number; y: number }> = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;

      const x = pos.x + dx;
      const y = pos.y + dy;

      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        adjacent.push({ x, y });
      }
    }
  }

  return adjacent;
}
```

**Usage:**

```typescript
import { getDistance, getSphereArea, isInCone } from '@/shared/spell-geometry';

// Check spell range
const distance = getDistance({ x: 5, y: 5 }, { x: 10, y: 10 });
console.log(`Distance: ${distance} feet`); // 35.36 feet

// Calculate fireball area
const affected = getSphereArea({ x: 10, y: 10 }, 20, 30, 30);
console.log(`Affected squares: ${affected.length}`); // ~12 squares

// Check if target is in cone
const inCone = isInCone(
  { x: 10, y: 5 }, // Target
  { x: 5, y: 5 }, // Caster
  { x: 1, y: 0 }, // Direction (east)
  15, // Length (feet)
  Math.PI / 3 // 60-degree cone
);
```

**See Also:** [[../combat/spell-targeting.ts|Combat Spell Targeting]]

---

## Spell Loadouts (`spellLoadouts.ts`)

Pre-configured spell lists for character creation.

### Loadout Interface

```typescript
export interface SpellLoadout {
  class: string;
  level: number;
  cantrips: string[]; // Spell IDs
  preparedSpells: string[]; // Spell IDs
  spellSlots: Record<number, number>; // Level → slots
}
```

### Example Loadouts

```typescript
export const WIZARD_LEVEL_1_LOADOUT: SpellLoadout = {
  class: 'Wizard',
  level: 1,
  cantrips: ['fire_bolt', 'mage_hand', 'prestidigitation'],
  preparedSpells: ['magic_missile', 'shield', 'detect_magic', 'identify', 'mage_armor', 'sleep'],
  spellSlots: {
    1: 2,
  },
};

export const CLERIC_LEVEL_3_LOADOUT: SpellLoadout = {
  class: 'Cleric',
  level: 3,
  cantrips: ['sacred_flame', 'guidance', 'thaumaturgy'],
  preparedSpells: ['cure_wounds', 'healing_word', 'bless', 'guiding_bolt', 'spiritual_weapon', 'lesser_restoration'],
  spellSlots: {
    1: 4,
    2: 2,
  },
};
```

### Available Loadouts

```typescript
export const SPELL_LOADOUTS: Record<string, SpellLoadout[]> = {
  Wizard: [
    WIZARD_LEVEL_1_LOADOUT,
    WIZARD_LEVEL_3_LOADOUT,
    WIZARD_LEVEL_5_LOADOUT,
  ],
  Cleric: [
    CLERIC_LEVEL_1_LOADOUT,
    CLERIC_LEVEL_3_LOADOUT,
    CLERIC_LEVEL_5_LOADOUT,
  ],
  Sorcerer: [...],
  Warlock: [...],
  Druid: [...],
  Bard: [...],
  Paladin: [...],
  Ranger: [...],
};
```

**Usage:**

```typescript
import { SPELL_LOADOUTS } from '@/shared/spellLoadouts';

function getStartingSpells(characterClass: string, level: number): SpellLoadout {
  const loadouts = SPELL_LOADOUTS[characterClass];
  return loadouts.find((l) => l.level === level) || loadouts[0];
}

const wizardSpells = getStartingSpells('Wizard', 1);
console.log(wizardSpells.cantrips); // ['fire_bolt', 'mage_hand', ...]
```

---

## Design Philosophy

### Pure Functions

All functions are **pure** (no side effects, deterministic).

```typescript
// ✅ GOOD: Pure function
export function getDistance(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) * 5;
}

// ❌ BAD: Side effects
let lastDistance = 0;
export function getDistance(p1, p2) {
  lastDistance = Math.sqrt(...); // Mutates external state
  return lastDistance;
}
```

### No Dependencies

Shared utilities have **zero external dependencies** (except TypeScript types).

```typescript
// ✅ GOOD: Self-contained
export function getSphereArea(center, radius, width, height) {
  // Only uses built-in Math functions
}

// ❌ BAD: External dependency
import { db } from '@/config/firebase';
export function getSphereArea(...) {
  // Uses external service
}
```

### Testable

All functions are easily unit-testable.

```typescript
describe('spell-geometry', () => {
  it('calculates distance correctly', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25); // 5 squares * 5 feet
  });

  it('generates sphere area', () => {
    const area = getSphereArea({ x: 5, y: 5 }, 20, 20, 20);
    expect(area.length).toBeGreaterThan(10);
    expect(area).toContainEqual({ x: 5, y: 5 }); // Center included
  });
});
```

---

## Related Documentation

- [[../combat/spell-targeting.ts|Combat Spell Targeting]] - Uses these utilities
- [[../types/README-SPELLS.md|Spell System]] - Spell data structures
- [[../../.cursor/rules/README.md#rule-26|Rule 26: Functional First]] - Pure function principle

---

Built following [[../../.cursor/rules/README.md|Rule 26: Composable & Functional First]] - small, pure, reusable functions.
