# Proposal 04: Speed Attribute Migration Plan

**Specific Migration Plan for `speed: integer` -> `speed: CapabilityJSON`**

## 1. The Goal

Transition from a simple integer representation of speed (e.g., `30`) to a structured capability object to support D&D 5e movement rules.

**Target Data Shape:**

```typescript
interface SpeedCapabilities {
  walk: number; // Default 30
  fly?: number; // e.g. 60
  swim?: number; // e.g. 30
  climb?: number; // e.g. 15
  burrow?: number;
  hover?: boolean; // Special tag
}
```

## 2. Phase 1: Code Preparation (The Engine Kernel)

1. **Update Types** in `@daicer/engine`:
   ```typescript
   export type SpeedValue = number | SpeedCapabilities; // Interim union type
   ```
2. **Create Utility Helper**:
   ```typescript
   // engine/src/utils/movement.ts
   export const getMovementModes = (speed: SpeedValue): SpeedCapabilities => {
     if (typeof speed === 'number') return { walk: speed };
     return { walk: 30, ...speed };
   };
   ```
3. **Refactor Calling Code**:
   Identify all usages of `.speed` (Pathfinding, UI, CharacterSheet) and replace direct access with `getMovementModes(entity.speed)`.

## 3. Phase 2: Database Migration (Strapi)

1. **Schema Update**:
   - In Strapi Content-Structure Builder, change the `speed` field from `Number` to `JSON` component.
   - _Note_: This might be destructive in Strapi. Safer to add `speed_v2` (JSON) and keep `speed` (Number) temporarily.
2. **Data Migration Script**:
   Create a backend script (`backend/scripts/migrate_speed.ts`) to iterate all Characters/Monsters:
   ```typescript
   const entities = await strapi.db.query('api::creature.creature').findMany();
   for (const ent of entities) {
     if (typeof ent.speed === 'number') {
       await strapi.entityService.update('api::creature.creature', ent.id, {
         speed: { walk: ent.speed },
       });
     }
   }
   ```

## 4. Phase 3: Frontend Update

1. **Character Sheet UI**:
   - Change the single input field `Speed: [ 30 ]` to a composite input or a "Movement Modes" section.
   - Add fields for Fly, Swim, Climb.
2. **HUD/Tooltip**:
   - Update the hover tooltip in `GameDebugView.tsx` to list all speeds: "Speed: 30ft (Fly 60ft)".

## 5. Phase 4: Rules Implementation

1. **Pathfinding**:
   - Update `A*` algorithm to respect movement types.
   - _Fly_ ignores terrain cost/roughness?
   - _Swim_ allows water traversal.
2. **Validation**:
   - Logic: "Can this entity move to X?" now checks strict movement capabilities.

## 6. Verification

- **Test**: Create a "Bird" entity with `{ walk: 10, fly: 50 }`.
- **Assert**: Pathfinding over a "Chasm" tile works for Bird but fails for "Human" `{ walk: 30 }`.
