# Backend Data Centralization

## Core Principle

Ideally, data should be centralized on the backend (Strapi) rather than existing only ephemerally on the frontend.

## Guidelines

1.  **Prompts & Configuration**: AI Prompts, game configuration constants, and "magic strings" should be stored in Strapi. This allows them to be tweaked without code changes.
2.  **Reusable Form Data**: Options, lists, and reference data used in frontend forms should be fetched from the backend.
3.  **Avoid Ephemeral Loss**: Do not generate important data solely on the frontend where it can be lost on refresh or navigation. If it's worth generating, it's worth saving.

## Policy Level

**Advisable / Recommended**.
While not strictly mandatory for every single interaction, it is highly recommended to follow this pattern for any data that has potential for reuse or needs permanence.
