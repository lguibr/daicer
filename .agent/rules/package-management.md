---
trigger: always_on
---

# Package Management

## Strict Usage
- **Yarn Only**: We **ALWAYS** use `yarn` for dependency management.
  - `yarn install`
  - `yarn add <package>`
  - `yarn remove <package>`

- **Never NPM**: Do **NOT** use `npm install`. This will break the lockfile consistency.

## One-Off Scripts
- **NPX**: It is acceptable to use `npx` for running one-off executables or binaries (e.g., `npx create-vite@latest`, `npx strapi generate`).
