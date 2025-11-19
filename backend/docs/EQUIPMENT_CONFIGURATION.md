# Equipment System Configuration

## Summary of Changes (2025-11-18)

This document describes the equipment configuration system for DAICE, including starting packs, gold options, and stat calculations.

---

## 1. Starting Gold Options (Easy to Change!)

**Location:** `backend/src/config/equipment.ts`

```typescript
export const STARTING_GOLD_CONFIG = {
  BONUS_WITH_PACK: 50, // Bonus gold when taking standard pack
  FREE_CHOICE_GOLD: 100, // Total gold for free shopping
};
```

**Player Choices:**

- **Option 1:** Take class-specific pack + 50gp extra (total value varies by class, max 150gp)
- **Option 2:** Skip pack and get 100gp to buy freely

---

## 2. Starting Packs by Class

**Location:** `backend/src/services/equipment/startingPacks.ts`

All packs cost under **150gp** (MAX_PACK_COST).

| Class         | Pack Cost | + Bonus | Total Value |
| ------------- | --------- | ------- | ----------- |
| **Fighter**   | 100gp     | +50gp   | 150gp       |
| **Paladin**   | 100gp     | +50gp   | 150gp       |
| **Rogue**     | 95gp      | +50gp   | 145gp       |
| **Bard**      | 90gp      | +50gp   | 140gp       |
| **Cleric**    | 87gp      | +50gp   | 137gp       |
| **Warlock**   | 85gp      | +50gp   | 135gp       |
| **Wizard**    | 70gp      | +50gp   | 120gp       |
| **Sorcerer**  | 65gp      | +50gp   | 115gp       |
| **Ranger**    | 64gp      | +50gp   | 114gp       |
| **Barbarian** | 55gp      | +50gp   | 105gp       |
| **Druid**     | 45gp      | +50gp   | 95gp        |
| **Monk**      | 25gp      | +50gp   | 75gp        |

### Pack Contents (Simplified for Testing)

**Heavy Armor Classes** (Fighter, Cleric, Paladin):

- Chain Mail (75gp, AC 16)
- Longsword or Simple Weapon (15gp or 1sp)
- Shield (+2 AC, 10gp)
- Backup weapon(s)

**Light Armor Classes** (Ranger, Rogue, etc.):

- Leather Armor (10gp, AC 11+DEX)
- Primary weapon (varies)
- Backup weapons

---

## 3. Equipment Slots

### Visual Slots (for AI Portrait Generation)

**Location:** `backend/src/config/equipment.ts`

```typescript
export const VISUAL_EQUIPMENT_SLOTS = [
  'mainHand', // Primary weapon
  'offHand', // Secondary weapon
  'armor', // Body armor
  'shield', // Shield
  'head', // Helmet/hat
  'cloak', // Cloak/cape
  'belt', // Belt
];
```

These items are included in the AI prompt for character portrait generation.

### Stat Slots (for AC/HP/Attack Calculations)

```typescript
export const STAT_EQUIPMENT_SLOTS = [
  'mainHand', // Attack damage
  'offHand', // Off-hand bonuses
  'armor', // AC calculation
  'shield', // AC +2
  'hands', // Gloves (future bonuses)
  'feet', // Boots (future bonuses)
  'ring1', // Ring slot 1
  'ring2', // Ring slot 2
  'belt', // Belt (future bonuses)
];
```

---

## 4. Stat Calculations

**Location:** `backend/src/services/equipment/statCalculations.ts`

### `calculateCharacterStats(equippedItems, baseAC)`

Returns:

```typescript
{
  totalAC: number,              // Final AC (armor + shield + bonuses)
  armorAC: number,              // AC from armor only
  shieldAC: number,             // AC from shield
  canAddDexToAC: boolean,       // Can add DEX mod?
  maxDexBonus: number | null,   // Max DEX allowed (medium armor)
  totalWeight: number,          // Encumbrance
  speedPenalty: number,         // Movement penalty
  stealthDisadvantage: boolean, // Heavy armor penalty
  equippedWeapons: [...],       // Weapon details
  equippedValue: number,        // Total gold value
}
```

### `getVisualEquipment(equippedItems)`

Returns equipment visible in portraits:

```typescript
{
  visualItems: [...],           // Array of visible items
  visualDescription: string,    // AI-friendly description
}
```

**Example AI Description:**

```
"Equipped with: Longsword (Weapon), Chain Mail (Armor), Shield (Armor)"
```

---

## 5. Implementation Notes

### Equipped vs Inventory

**Equipped Items:**

- Track in `character.equipment.equippedItems` object
- Keys are slot names: `{ mainHand: 'longsword', armor: 'chain-mail', ... }`
- Used for:
  - **Stat calculations** (AC, attack bonuses)
  - **Portrait generation** (visual appearance)
  - **Combat mechanics** (damage, range)

**Inventory Items:**

- Track in `character.equipment.inventory` array
- Format: `[{ itemIndex: 'dagger', quantity: 2 }, ...]`
- Items not equipped but owned
- Can be sold, traded, or equipped later

### AC Calculation Example

```typescript
// Base AC (no armor) = 10
// Leather Armor: AC 11 + DEX modifier
// Chain Mail: AC 16 (no DEX bonus)
// Shield: +2 to AC

// Rogue with DEX +3:
// Leather (11) + DEX (3) + Shield (2) = AC 16

// Fighter with DEX +1:
// Chain Mail (16) + Shield (2) = AC 18 (DEX ignored)
```

### Portrait Generation Integration

When generating character portrait:

```typescript
const visualEquip = getVisualEquipment(character.equipment.equippedItems);
const prompt = `
  ${character.appearance.description}
  ${visualEquip.visualDescription}
  Fantasy art style, D&D character portrait
`;
```

---

## 6. How to Change Values

### Change Starting Gold:

**File:** `backend/src/config/equipment.ts`

```typescript
// Give 75gp bonus with pack instead of 50gp:
BONUS_WITH_PACK: 75,

// Give 150gp for free choice instead of 100gp:
FREE_CHOICE_GOLD: 150,
```

### Change Max Pack Cost:

```typescript
// Allow packs up to 200gp:
export const MAX_PACK_COST = 200;
```

### Add Item to Pack:

**File:** `backend/src/services/equipment/startingPacks.ts`

```typescript
const FIGHTER_PACK: StartingPack = {
  className: 'Fighter',
  items: [
    { itemIndex: 'longsword', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'shield', quantity: 1, autoEquip: true, slot: 'shield' },
    { itemIndex: 'chain-mail', quantity: 1, autoEquip: true, slot: 'armor' },
    { itemIndex: 'dagger', quantity: 2 }, // Backup weapons
    // ADD NEW ITEM:
    { itemIndex: 'rope-hempen', quantity: 1 }, // Add rope
  ],
  totalCostInGold: 105, // Update total cost
};
```

---

## 7. Testing Checklist

- [ ] Player can choose pack or gold at character creation
- [ ] Equipped items show in character sheet
- [ ] AC calculated correctly from armor + shield
- [ ] Visual equipment sent to AI for portrait generation
- [ ] Weapons show damage and range
- [ ] Inventory tracks unequipped items
- [ ] Can equip/unequip items from inventory
- [ ] Total weight calculated for encumbrance
- [ ] Stealth disadvantage shown for heavy armor

---

## 8. Future Enhancements

- **Magic Items:** Add `+X` bonuses to weapons/armor
- **Attunement:** Limit number of attuned magic items
- **Cursed Items:** Items that can't be unequipped
- **Set Bonuses:** Bonuses for wearing complete armor sets
- **Encumbrance Rules:** Speed penalties based on weight vs Strength
- **Item Durability:** Track item condition/damage
- **Crafting:** Create/upgrade items
- **Trading:** Player-to-player item exchange

---

**Last Updated:** 2025-11-18  
**Files Modified:**

- `backend/src/config/equipment.ts` (NEW)
- `backend/src/services/equipment/startingPacks.ts` (UPDATED)
- `backend/src/services/equipment/statCalculations.ts` (NEW)
