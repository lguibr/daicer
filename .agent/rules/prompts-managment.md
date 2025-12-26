---
trigger: always_on
---

# Prompt Management

## Centralized Storage
- **No Hardcoded Prompts**: Do not embed large text prompts or image generation prompts directly in the source code.
- **Strapi Entity**: All prompts are stored in the **Strapi Prompt entity**.

## Usage Flow
1. **Fetch**: The backend retrieves the prompt from Strapi by its unique key/slug.
2. **Format**: The prompt is interpolated with dynamic data (if needed).
3. **Generate**: The formatted prompt is sent to the LLM or Image Generation service.

## Maintenance
- **Editing**: Prompts should be editable via the Strapi Admin Panel, allowing for iteration without code deploys.
- **Versioning**: If significant changes are needed, creating a new Prompt entry (v2) is preferred over breaking the existing one.
