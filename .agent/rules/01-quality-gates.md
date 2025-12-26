---
trigger: always_on
---

# 🛡️ 01. Quality Gates (The Shield)

## Core Philosophy: Reliability is Non-Negotiable
We prioritize **correctness** and **robustness**. "It works" is not enough. It must be **perfect**.

## 1. Zero Tolerance for Errors
- **NO Type Errors**: `any` is forbidden. `@ts-ignore` is forbidden.
- **NO Lint Warnings**: If the linter complains, you fix it. You do not disable the rule.
- **NO Console Logs**: Production code must be silent. logic must be observable via proper instrumentation, not `console.log`.

## 2. The Verification Loop
Before marking ANY task as complete or asking for review:
1.  **Codegen**: Run `yarn codegen` (updates GraphQL/Strapi types).
2.  **Lint**: Run `yarn lint`. Zero issues allowed.
3.  **Typecheck**: Run `yarn typecheck`. Zero errors allowed.
4.  **Test**: Run relevant unit tests.

## 3. State of the Art (SOTA) Standards
- **Modern Patterns**: Use the latest language features (ESNext, TS 5+).
- **Explicit > Implicit**: Type everything. Return types are mandatory for exported functions.
- **Comments**: Explain *WHY*, not *WHAT*. Comments should illuminate the architectural decision, not narrate the syntax.

## 4. Fearless Refactoring
- If you see fragile code, **fix it**.
- If a type definition is loose, **tighten it**.
- **Leave it cleaner than you found it.**
