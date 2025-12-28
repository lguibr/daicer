# 📦 05. Package Management (The Supply Chain)

## 1. The Yarn Mandate

**Rule**: We use **Yarn** exclusively.

- **Why**: Deterministic dependency resolution. Mixing package managers breaks the lockfile.
- **Commands**:
  - `yarn install`: The only way to install.
  - `yarn add <pkg>`: The only way to add.
  - `yarn remove <pkg>`: The only way to remove.

## 2. Lockfile Sanctity

**Rule**: The `yarn.lock` file is sacred.

- **Commit It**: Always commit `yarn.lock`.
- **Review It**: If a PR changes `yarn.lock` unexpectedly, reject it.
- **CI/CD**: The build pipeline must fail if `yarn.lock` is out of sync (`yarn install --frozen-lockfile`).

## 3. One-Off Executions

**Rule**: Use `npx` for transient/initialization tasks only.

- **Acceptable**: `npx create-vite@latest`, `npx strapi generate`.
- **Forbidden**: `npm install`, `npm run`.

## 4. Workspaces (Monorepo)

**Rule**: Respect the workspace boundaries.

- **Root**: Manage global dev dependencies (e.g., eslint, husky) at the root.
- **Leaf**: Application-specific dependencies belong in their respective `package.json` (`/backend`, `/frontend`).
- **No Hoisting Abuse**: Do not rely on implicit hoisting. If a package uses a library, listing it in `package.json` is mandatory.
