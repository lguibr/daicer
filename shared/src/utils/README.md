# Shared Utilities

## Purpose

General purpose utility classes and functions shared between frontend, backend, and engine.

## Key Entities

- `RoomRuneGenerator`: Generates 6-character non-sequential runes from integer IDs for room joining.

## Usage

```typescript
import { RoomRuneGenerator } from '@daicer/shared';

const generator = new RoomRuneGenerator();
const rune = generator.encode(12345);
```
