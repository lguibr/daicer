# Contributing to Daicer

Thank you for contributing to Daicer! This guide will help you get started.

## Development Setup

```bash
# Install dependencies
yarn install:all

# Start development environment
yarn dev

# This runs:
# - Firebase emulators
# - Backend server
# - Frontend dev server
```

## Code Standards

### File Headers

All TypeScript/JavaScript files must include a standardized header. See [FILE_HEADER_STANDARD.md](./FILE_HEADER_STANDARD.md) for details.

**Quick example:**

```typescript
/**
 * @file path/to/your/file.ts
 * @note Update README.md in this directory when modifying behavior
 */
```

**Add headers automatically:**

```bash
node scripts/add-file-headers.js
```

### TypeScript

- **Strict mode**: All files use strict TypeScript
- **No `any`**: Use proper types or `unknown`
- **Props**: Fully typed with interfaces

### Testing

- **Location**: Tests colocated with source (`__tests__/` or `.test.ts`)
- **Pattern**: TDD (red → green → refactor)
- **Coverage**: Aim for >80% on new code

```bash
# Run tests
yarn test

# Run with coverage
yarn test:coverage

# Frontend coverage report: frontend/coverage/index.html
# Backend coverage report: backend/coverage/index.html
```

### Documentation

**Component README Requirements:**

Every component directory (`ui/`, `combat/`, `game/`) must have a `README.md` with:

1. **Mermaid diagram** showing component architecture
2. **Component descriptions** with usage examples
3. **Data flow** explanations
4. **Integration points**

**Update README when:**

- Adding/removing props
- Changing component behavior
- Adding variants or states
- Modifying data flow

### Code Style

```bash
# Format code
yarn format

# Fix linting issues
yarn lint:fix

# Type check
yarn typecheck

# Run all QA checks (format, lint, typecheck, test with coverage)
yarn qa
```

## Component Development

### 1. Create Component

```typescript
/**
 * @file frontend/src/components/ui/new-component.tsx
 * @note Update README.md in this directory when modifying component behavior or props
 */

import React from 'react';

interface NewComponentProps {
  // Fully typed props
}

export function NewComponent({ ...props }: NewComponentProps) {
  return <div>Component content</div>;
}
```

### 2. Write Tests

```typescript
/**
 * @file frontend/src/components/ui/__tests__/NewComponent.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent />);
    // Add assertions
  });
});
```

### 3. Create Storybook Stories

```typescript
/**
 * @file frontend/src/components/ui/NewComponent.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from './NewComponent';

const meta = {
  title: 'UI/NewComponent',
  component: NewComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof NewComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

### 4. Update README

Add component to `frontend/src/components/ui/README.md`:

```markdown
#### NewComponent

Brief description of component purpose.

\`\`\`tsx
<NewComponent prop="value" />
\`\`\`
```

### 5. Export from Index

Add to `frontend/src/components/ui/index.ts`:

```typescript
export { NewComponent } from './NewComponent';
export type { NewComponentProps } from './NewComponent';
```

## Git Workflow

1. **Create branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Follow code standards above
3. **Add file headers**: `node scripts/add-file-headers.js`
4. **Run QA**: `yarn qa` (includes coverage)
5. **Commit**: Clear, descriptive messages
6. **Push**: `git push origin feature/your-feature`
7. **Pull Request**: Reference any related issues

## Testing Strategy

### Unit Tests

- Test individual component behavior
- Mock external dependencies
- Cover edge cases and error states

### Integration Tests

- Test component interactions
- Test hook integrations
- Test real data flow

### Coverage Goals

- **UI Components**: >90% coverage
- **Business Logic**: >80% coverage
- **API Endpoints**: >75% coverage

**View coverage reports:**

```bash
# After running yarn qa or yarn test:coverage
# Frontend: open frontend/coverage/index.html
# Backend: open backend/coverage/index.html
```

## Storybook

View all components:

```bash
yarn storybook
```

Build static Storybook:

```bash
cd frontend && yarn build-storybook
```

## Common Commands

```bash
# Development
yarn dev                    # Start all services
yarn dev:frontend          # Frontend only
yarn dev:backend           # Backend only

# Testing
yarn test                  # Run all tests
yarn test:coverage         # Run tests with coverage
yarn test:frontend         # Frontend tests only
yarn test:backend          # Backend tests only

# Quality Assurance
yarn qa                    # Full QA pipeline with coverage
yarn lint                  # Lint all code
yarn lint:fix              # Fix linting issues
yarn format                # Format all code
yarn typecheck             # Type check all code

# Storybook
yarn storybook             # Start Storybook dev server

# Build
yarn build                 # Build frontend for production
```

## Project Structure

```
d20ai/
├── backend/              # Express + Socket.IO server
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── combat/      # Combat engine (LangGraph)
│   │   ├── graph/       # Game state graphs
│   │   ├── services/    # Business logic
│   │   └── socket/      # Socket.IO handlers
│   └── coverage/        # Test coverage reports
├── frontend/            # React + Vite app
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── ui/     # Primitive UI components
│   │   │   ├── combat/ # Combat-specific components
│   │   │   └── game/   # Game screen components
│   │   ├── hooks/      # React hooks
│   │   └── services/   # API clients
│   └── coverage/       # Test coverage reports
└── scripts/            # Utility scripts
```

## Questions?

- Check existing code for examples
- Review README files in component directories
- Ask in pull request discussions

## License

See LICENSE file for details.
