
# 🧠 08. Prompt Engineering (The Cortex)

## 1. Centralized Intelligence
**Rule**: **NO** hardcoded prompts in codebase files.
- **Why**: Prompts need iteration without deployment.
- **Where**: All prompts live in the **Strapi Prompt Entity**.
- **Slug**: Access prompts via unique, human-readable slugs (e.g., `dm-main-opening`, `combat-narrator-v1`).

## 2. The Interpolation Contract
**Rule**: Use Handlebars-style syntax explicitly.
- **Format**: `{{variableName}}`.
- **Validation**: backend must ensure all variables required by the prompt are provided at runtime.

## 3. Versioning & Iteration
**Rule**: Non-Destructive Updates.
- If completely changing a prompt's logic, create a new Prompt Entry (e.g., `dm-combat-v2`).
- Update the code to point to the new slug.
- Archive the old prompt (do not delete immediately).

## 4. Testing
**Rule**: Prompts must be testable via the "Playground" script.
- **Test Script**: `scripts/test-prompt.ts <slug> <json-context>`.
- **Verification**: Ensure the LLM output adheres to the expected JSON schema (if applicable).
