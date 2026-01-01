# 🔗 Shared Kernel Testing Rules (The Contract)

> **Philosophy**: The Shared Kernel is the _Law_. It defines the schemas, types, and constants that bind the Monorepo. Tests here are purely about **Correctness** and **Validation**.

## 1. The Schema is the Truth

**Rule**: Every Zod Schema must have a comprehensive "Invalid Input" and "Valid Input" suite.
**Why**: If formatting validation fails here, the Agent hallucinates and the Engine creates garbage.
**Implementation**:

- **Positive Testing**: `Schema.parse(validData)` should pass.
- **Negative Testing**: `Schema.parse(invalidData)` should throw distinct error messages.
- Test edge cases: Empty strings, negative numbers in stats, extremely long strings.

## 2. Zero-Dependency Purity

**Rule**: Shared tests MUST NOT import from `@daicer/engine`, `backend`, or `frontend`.
**Why**: Circular dependencies start here. The Kernel stands alone.
**Implementation**:

- Validate imports in test files.
- If you need a complex object, define it locally or use a Kernel-level factory.

## 3. Serialization/Deserialization (SerDes)

**Rule**: Verify the round trip.
**Why**: Data traverses the wire (JSON). Dates, Maps, and Sets die on the wire.
**Implementation**:

- Test that objects can be `JSON.stringify`ed and `JSON.parse`ed back into a valid state that passes the Zod Schema.
- Especially critical for `CharacterSheet` and `WorldState`.

## 4. Utility Function Atomicity

**Rule**: One function, one job, five tests.
**Why**: Utilities like `calculateModifier` are used everywhere. A bug here is a bug everywhere.
**Implementation**:

- Test strict boundary conditions (e.g., Ability Score 10 -> +0, 11 -> +0, 12 -> +1).
- Test mathematical edge cases (Infinity, NaN inputs if not strictly typed).

## 5. Type Guard Integrity

**Rule**: Custom Type Guards (`isCharacter`, `isMonster`) must be bulletproof.
**Why**: The generic `Entity` type is used heavily. Guards prevent runtime crashes.
**Implementation**:

- Pass "almost correct" objects to Type Guards (e.g., a Character missing the `stats` field) and ensure they return `false`.

## 6. Snapshot Stability

**Rule**: Use Snapshots sparingly, only for massive schemas.
**Why**: Zod schemas are complex objects.
**Implementation**:

- If you change a Schema, the Snapshot diff warns you of breaking API changes.
- Treat a broken Snapshot as a "Breaking Change Alert" for the Frontend/Backend teams.

## 7. No external IO

**Rule**: No file access, no network access.
**Why**: This package is distributed to the browser.
**Implementation**:

- Validating the environment: If a test tries to read `process.env` or `fs`, it fails.
