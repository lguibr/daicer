# Shared Schemas

## Purpose

This directory contains Zod schemas shared across the entire monorepo (Frontend, Backend, Engine). These schemas ensure type safety and data consistency at boundaries.

## Architecture

- **Layer**: Shared Kernel
- **Consumer**: Engine, Frontend, Backend API

## Key Entities

- `actor.ts`: Schemas related to game actors (Speed, etc.)

## Usage

```typescript
import { SpeedSchema } from '@daicer/shared';

const speed = SpeedSchema.parse(input);
```
