# 🏛️ 06. Strapi Architecture (The Monolith)

## Core Philosophy

We use Strapi as a **Headless Monolith**. It owns the data, the admin UI, and the business logic.

## 1. Project Structure

- **`src/api`**: Domain logic. One folder per Content Type.
  - `routes`: Define endpoints.
  - `controllers`: Handle HTTP/GraphQL requests.
  - `services`: Reusable business logic (keep fat services, thin controllers).
- **`src/extensions`**: Overrides for plugins (e.g., `users-permissions`).
- **`src/policies`**: Security rules.

## 2. The Document ID Standard

**Rule**: Use `documentId` for **everything**.

- **Why**: Strapi v5 introduced `documentId` as the stable, public identifier. `id` (integer) is an internal implementation detail.
- **Enforcement**:
  - GraphQL Queries: `user(documentId: "...")`
  - Frontend Routing: `/characters/:documentId`
  - Relations: Store `documentId` in foreign keys if manual linking is needed.

## 3. Plugins vs. API

- **Use Plugins (`src/plugins`)**: ONLY for generic, project-agnostic features (e.g., "Comments", "Ratings").
- **Use API (`src/api`)**: For domain-specific logic (e.g., "Game", "Room", "Character").
- **Do not over-engineer plugins**. 95% of logic belongs in `src/api`.

## 4. GraphQL Only

**Rule**: The Frontend speaks **only GraphQL**.

- No `axios` to REST endpoints.
- No `fetch` to generic routes.
- **Exception**: File Uploads (Multipart/form-data) must use REST.
