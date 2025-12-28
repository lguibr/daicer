---
trigger: always_on
---

# 🧹 02. Code Hygiene (The Broom)

## 1. The 200-Line Limit (Strict)

**Rule**: No file shall exceed 200 lines of source code.
**Why**: Atomic responsibility. If it's huge, it's doing too much.
**Action**:

- Hit 200 lines? **Refactor immediately**.
- Extract helpers, sub-components, or logic hooks.
- **Exceptions**: `.md`, `.json`, seeds, generated types.

## 2. DRY (Don't Repeat Yourself)

Before writing new utility logic, check the hierarchy:

1.  **`@daicer/shared`**: Is there a generic utility here?
2.  **`@daicer/engine`**: Is there a domain rule here?
3.  **`backend/src/utils`**: Is there a backend helper here?

**Do not duplicated code.** If you find duplication, refactor it into a shared location.

## 3. No Trash

- **Delete** `.tmp` files.
- **Delete** unused "playground" scripts.
- **Delete** commented-out legacy code (Git history exists for a reason).

## 4. Atomic Commits

- Changes should be focused.
- Don't mix "Reformatting" with "Feature Work".
- Don't mix "Refactoring" with "Bug Fixing".
