# Typecheck Policy

After making some changes:

1.  **Run Codegen**: Execute the generation scripts (e.g., `yarn codegen`) to update types from dependencies (Strapi, GraphQL, etc.).
2.  **Run Typecheck**: Run the type checker (e.g., `yarn typecheck` or `tsc --noEmit`) to ensure the changes haven't introduced any type errors or regressions.
3.  **Ensure No Breakers**: Verify that there are no breaking changes before proceeding.
