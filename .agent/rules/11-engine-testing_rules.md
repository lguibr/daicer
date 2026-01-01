# ⚙️ Engine Testing Rules (The Physics)

> **Philosophy**: The Engine is the _God of Rules_. It is deterministic, server-authoritative, and blind to the User Interface. "If it isn't tested in the Engine, it doesn't exist in the Game."

## 1. Absolute Determinism

**Rule**: `f(state, action) = next_state `. ALWAYS.
**Why**: Sync bugs occur when `Client Engine` and `Server Engine` disagree.
**Implementation**:

- Eliminate `Math.random()`. Use a Seeded PRNG for checks.
- If you run the same test 10,000 times, you get the exact same result 10,000 times.

## 2. The Command/Event Separation

**Rule**: Test the _Dispatcher_, not just the helper functions.
**Implementation**:

- **Input**: A Dispatch object `{ type: 'ATTACK', targetId: '...' }`.
- **Output**: An Event object `{ type: 'DAMAGE_DEALT', ... }`.
- Verify that _invalid_ commands throw coherent errors ("Target out of range", "Not enough AP").

## 3. High-Frequency Stability (The "Click Spam" Test)

**Rule**: The engine must handle 100 actions/sec without corrupting state.
**Why**: Users double-click. Lag causes burst usage.
**Implementation**:

- Create a test loop that fires invalid or conflicting actions rapidly.
- Ensure state remains consistent (e.g., HP never drops below 0 unless specific "Death" logic runs, Turn Counter increments atomically).

## 4. Voxel Performance

**Rule**: Walkability checks must be O(1) or very generic O(log n).
**Why**: Pathfinding checks thousands of tiles per frame.
**Implementation**:

- Test large maps (100x100 chunks).
- Measure execution time of `getTileAt`. Assert it stays under microsecond thresholds.

## 5. Simulation Testing (Chaos Monkey)

**Rule**: Run a game with 4 AI bots for 1000 turns.
**Why**: Edge cases emerge over time (e.g., integer overflow, rounding errors, resource leaks).
**Implementation**:

- Creating a headless simulation scripts.
- Randomly pick valid actions.
- Assert "Invariants" at every step (e.g., `CurrentHP <= MaxHP`, `Position` is within bounds).

## 6. Logic Parity (D&D 5e Rules)

**Rule**: Cite the page number in the test.
**Why**: "Engine says +2" - Why?
**Implementation**:

- Comments in tests should reference the rule source.
- `// SRD 5.1, pg 90: Proficiency bonus is +2 at Level 1.`
- Verify specific complex interactions (Advantage canceling Disadvantage).

## 7. Component Isolation

**Rule**: Test rules in isolation, then system integration.
**Implementation**:

- **Level 1**: Test `calculateDamage(weapon, stats)`.
- **Level 2**: Test `CombatSystem.resolveAttack()`.
- **Level 3**: Test `ActionDispatcher.dispatch('ATTACK')`.

## 8. No View Logic

**Rule**: `console.log` and formatted strings are forbidden in logic.
**Why**: The engine doesn't know English or HTML.
**Implementation**:

- The engine returns `{ damage: 5, type: 'fire' }`.
- It does **NOT** return `"You hit the goblin for 5 fire damage!"`.
- Tests fail if they detect "flavor text" in the return values.
