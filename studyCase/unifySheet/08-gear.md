# 08. Gear: Inventory vs. Natural Weapons

## The Disparity

### Monster (Current)

- **Natural Weapons**: Defined in `actions` (e.g., "Bite", "Claw").
- **Equipment**: Usually implicit. The "Scimitar" action implies a scimitar element, but there's no "Inventory" list containing a "Scimitar" item.
- AC is sometimes `{ type: "natural", value: 17 }` or `{ type: "armor", value: 18, armor: "Plate" }`.

### Character (Current)

- `inventory`: Array of `InventoryItem` components.
- **Weapons**: Explicit `Equipment` items (e.g., `Longsword`).
- **Armor**: Explicit `Equipment` items (e.g., `Chain Mail`).
- AC and Attacks are **derived** from these items.

## The Standardized "Unified Sheet" Model

The Sheet needs a unified `Inventory` or `Attacks` list.

### Proposed Structure

```typescript
interface Sheet {
  inventory: InventoryItem[]; // Droppable loot
  naturalWeapons: NaturalWeapon[]; // Innate body parts
}

interface NaturalWeapon {
  name: string; // "Bite"
  damage: DamageDice[];
  toHitBonus: number;
}
```

## Unification Strategy

1.  **For Monsters**:
    - "Bite" -> `naturalWeapons`.
    - "Scimitar" -> `inventory` (If we want it to be lootable).
    - **Simplification**: For now, treat _everything_ in the Monster's `actions` list as a "Certified Action" and don't try to reverse-engineer an Inventory unless explicitly needed for loot generation.
2.  **For Characters**:
    - Inventory is the source of truth.
    - `CharacterDeriver` scans Inventory -> Generates "Actions".

**Key Decision**:
The `CharacterSheet` will have a derived `actions` list (runtime only) that combines:

- `inventory.filter(isWeapon)`
- `naturalWeapons`
- `spells` (if prepared)
