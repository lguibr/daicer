# File Header Standard

All TypeScript/JavaScript files in this project should include a standardized header comment with:

1. **File path** (relative to project root)
2. **README update reminder** (for component files)

## Format

### Standard Files

```typescript
/**
 * @file path/to/file.ts
 */
```

### Component Files

Component files should include a README update reminder:

```typescript
/**
 * @file frontend/src/components/ui/button.tsx
 * @note Update README.md in this directory when modifying component behavior or props
 */
```

### Files with Description

For complex files, you may optionally add a description:

```typescript
/**
 * @file backend/src/services/game.ts
 * @description Core game state management and LangGraph integration
 * @note Update README.md when changing game flow or state structure
 */
```

## Examples

### UI Component

```typescript
/**
 * @file frontend/src/components/ui/button.tsx
 * @note Update README.md in this directory when modifying component behavior or props
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
// ... rest of file
```

### API Endpoint

```typescript
/**
 * @file backend/src/api/rooms.ts
 */

import { Router } from 'express';
// ... rest of file
```

### Utility Function

```typescript
/**
 * @file backend/src/utils/logger.ts
 * @description Winston logger configuration for structured logging
 */

import winston from 'winston';
// ... rest of file
```

### Test File

```typescript
/**
 * @file frontend/src/components/ui/__tests__/Button.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
// ... rest of file
```

### Storybook Story

```typescript
/**
 * @file frontend/src/components/ui/button.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
// ... rest of file
```

## Automation

Use the provided script to add headers to files automatically:

```bash
# Add headers to all files
node scripts/add-file-headers.js

# Add headers to specific directory
node scripts/add-file-headers.js frontend/src/components

# Add headers to backend only
node scripts/add-file-headers.js backend/src
```

## Why File Headers?

1. **Orientation**: Developers can immediately see where they are in the codebase
2. **Documentation**: Reminds developers to keep documentation updated
3. **Navigation**: Makes it easier to find files when reading code snippets
4. **Standards**: Enforces consistent documentation across the project

## When to Update README

Update the README.md in the component's directory when you:

- Add or remove component props
- Change component behavior or API
- Add new variants or states
- Modify data flow or state management
- Change integration points with other components
- Add new features or capabilities

## Integration with Development Workflow

The file header standard is enforced through:

1. **Manual review**: Code reviewers check for headers
2. **Automated script**: Run before commits to add missing headers
3. **Documentation**: This standard document for reference

## Notes

- Headers are automatically added by the `add-file-headers.js` script
- Skip headers for generated files (e.g., build output, type definitions)
- Headers should be the first thing in the file (before imports)
- Keep headers concise - detailed docs go in README files
