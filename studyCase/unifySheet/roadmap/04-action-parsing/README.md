# Phase 4: Action Parsing (The Hard Part)

> **Objective**: Convert the "Wall of Text" actions into a structured, automatable format.

This requires advanced regex and potentially LLM assistance if using a script.

## 4.1. The Regex Suite

We need robust regex patterns to identify 5e syntax.

- **Attack Roll**: `/\+([0-9]+) to hit/` -> `toHit`.
- **Reach**: `/reach\s+([0-9]+)\s*ft/` -> `reach`.
- **Damage**: `/([0-9]+)\s*\(([0-9]+d[0-9]+)\s*\+\s*([0-9]+)\)\s*([a-z]+)\s*damage/i`
  - Group 1: Avg (7)
  - Group 2: Dice (2d6)
  - Group 3: Bonus (3)
  - Group 4: Type (slashing)
- **Save DC**: `/DC\s*([0-9]+)\s*([a-zA-Z]+)\s*saving throw/i` -> `save.dc`, `save.stat`.
- **Area of Effect**:
  - **Cone**: `/([0-9]+)-foot cone/i` -> `area: { shape: 'cone', size: $1 }`.
  - **Line**: `/([0-9]+)-foot line/i` -> `area: { shape: 'line', size: $1 }`.
  - **Sphere/Circle**: `/([0-9]+)-foot (sphere|radius)/i` -> `area: { shape: 'sphere', size: $1 }`.

## 4.2. The Parsing Script

Script: `scripts/unify/parse_actions.ts`

- **Input**: `monster.actions` (JSON Array).
- **Process**:
  - Iterate each action.
  - Attempt to match "Melee/Ranged Weapon Attack".
  - If match -> Parse Hit/Reach/Damage.
  - Create `game.action` object.
  - If description contains "DC X Save", parse it.
- **Output**: Write to `monster.structuredActions`.
- **Fallback**: If parsing fails (complex multi-stage action), write the original text to `description` and mark `type: utility`.

## 4.3. Multiattack Handling

- "Multiattack" is a special action.
- We need to parse "makes two attacks: one with its bite and one with its claws".
- **Structure**: Create a `Multiattack` component or just treat it as a descriptive utility action for now (V1). V2 can automate the sequence.

## Deliverable

A populated `structuredActions` list for ~90% of monsters. Complex edge cases (Liches, Beholders) might need manual cleanup.
