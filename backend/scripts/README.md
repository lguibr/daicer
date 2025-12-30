# Backend Maintenance Scripts

This directory contains standalone scripts for maintaining and auditing the Daicer backend content.

This directory contains standalone scripts for maintaining and auditing the Daicer backend content.

> [!IMPORTANT] > **🛑 MANDATORY READING**
> Before writing or running any script, you MUST read **[SCRIPTING_STANDARDS.md](./SCRIPTING_STANDARDS.md)**.
>
> **Rule #1:** NEVER instantiate `@strapi/strapi` in these scripts. ALWAYS use `@strapi/client` to connect to the running `yarn develop` instance.
> Ensure your development server is running: `yarn develop`

## 1. Content Audit

Audits the completion status of the 12 core entities.

### Usage

```bash
# Run from backend/ root
yarn ts-node scripts/audit-content.ts
```

### Output

Generates an HTML report with charts at the project root:
`daicer/report.html`

Open this file in your browser:

```bash
open ../report.html
```

---

## 2. Monster Image Generation

Generates "Magic the Gathering" style illustrations for monsters that missing images, using Google Gemini.

### Prerequisites

Ensure your `.env` file has the Gemini API Key:

```env
GEMINI_API_KEY=your_key_here
```

### Usage

**Basic Run (Default Limit: 5)**

```bash
yarn ts-node scripts/generate-monster-images.ts
```

**Custom Limit**
Generate up to 100 images:

```bash
yarn ts-node scripts/generate-monster-images.ts --limit=100
```

**Custom Model**
Override the default `gemini-2.5-flash-image` model:

```bash
GEMINI_IMAGE_MODEL='gemini-3-pro-image-preview' yarn ts-node scripts/generate-monster-images.ts
```

### Troubleshooting

- **403 Forbidden**: Ensure your `STRAPI_API_TOKEN` in `.env` has full permissions, or `API_TOKEN_SALT` is correctly configured if using legacy local logic.
