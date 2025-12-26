---
trigger: always_on
---

# File Length & Atomic Responsibility

## The 200-Line Limit
Is strict and mandatory for all source code (TS/TSX/JS).
- **Rule**: Keep files **under 200 lines**.
- **Why**: 
  - Enforces atomic, single-responsibility components.
  - "Stupid" components are easier to test, debug, and understand.
  - Enhances type tightness and readability.

## Exceptions
You may exceed this limit only for:
- Markdown documentation (`.md`)
- JSON data files
- Seed files / Data migrations
- Generated types or artifacts
- Complex configuration schemas (if absolutely necessary)

## Refactoring Strategy
If a file grows beyond 200 lines:
1. **Split it**. Extract logic into smaller, helper functions or sub-components.
2. **Simplify**. A file doing too much is a code smell. Break it down into "stupid", isolated parts.
