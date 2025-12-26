---
trigger: always_on
---

# 🏛️ 03. Backend Architecture (The Blueprint)

## 1. The Single Source of Truth (Strapi)
**Rule**: Logic configuration, Game Rules, and Prompts **MUST** live in Strapi.
- **Why**: We need to tweak game balance and AI personas without redeploying code.
- **Enforcement**:
  - Hardcoded magic strings? ❌ **Move to Strapi Constants**.
  - Hardcoded prompts? ❌ **Move to Strapi Prompts**.
  - Hardcoded game rules (e.g., "Strength adds +2")? ❌ **Move to Strapi Rules**.

## 2. Communication Protocol (GraphQL Only)
**Rule**: The Frontend speaks **GraphQL** to the Backend.
- **NO REST**: Do not use `axios` or `fetch` for data. Use Apollo Client.
- **Exceptions**: Network-level interactions (auth provider callbacks, webhooks, file uploads).

## 3. Identification Standard
**Rule**: Use **`documentId`** for everything.
- Strapi v5 uses `documentId` (string) as the stable public ID.
- Do NOT use numerical `id` for lookups or foreign keys.

## 4. Derived Truth
**Rule**: "Truth is a Derivation".
- We do not store "currentHP" if it can be calculated from "BaseHP - DamageTaken".
- Minimise state. Maximise calculation.
