# Deployment Guide

## Environment Matrix

| Context   | Location             | Purpose                                |
|-----------|----------------------|----------------------------------------|
| Frontend  | `.env.local`         | Vite dev server + Storybook            |
| Backend   | `backend/.env.local` | Express API + Firebase Admin           |
| CI        | GitHub Secrets/Vars  | Vitest + Jest + build pipelines        |
| Production| Platform config      | Vercel (web) / Cloud Run (api)         |

Read-only template for teammates:

```bash
# root/.env.example
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=
VITE_USE_EMULATORS=false
```

```bash
# backend/.env.example
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
LOG_LEVEL=info
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

## Local Setup

1. Copy templates.  
   `cp .env.example .env.local`  
   `cp backend/.env.example backend/.env.local`

2. Populate both files with project Firebase + AI credentials.

3. Run `yarn dev`. Ensure frontend loads without Firebase errors and backend logs correct project.

## GitHub Actions Configuration

### Secrets (Settings → Secrets and variables → Actions → New repository secret)

| Secret Name                        | Value                                             |
|------------------------------------|---------------------------------------------------|
| `VITE_FIREBASE_PROJECT_ID`         | Firebase web project ID                           |
| `VITE_FIREBASE_API_KEY`            | Firebase Web API key                              |
| `VITE_FIREBASE_AUTH_DOMAIN`        | `<project>.firebaseapp.com`                       |
| `VITE_FIREBASE_STORAGE_BUCKET`     | `<project>.appspot.com`                           |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase console value                            |
| `VITE_FIREBASE_APP_ID`             | Firebase console value                            |
| `FIREBASE_PROJECT_ID`              | Same as above                                     |
| `FIREBASE_CLIENT_EMAIL`            | Service account email                             |
| `FIREBASE_PRIVATE_KEY`             | Service account private key (escaped newline `\n`)|
| `FIREBASE_STORAGE_BUCKET`          | `<project>.appspot.com`                           |
| `GEMINI_API_KEY`                   | Gemini API key                                    |
| (optional) `OPENAI_API_KEY`        | OpenAI key if LangChain needs it                  |
| (optional) `ANTHROPIC_API_KEY`     | Anthropic key if enabled                          |

### Variables (Settings → Secrets and variables → Actions → New repository variable)

| Variable Name      | Example Value              |
|--------------------|----------------------------|
| `VITE_API_URL`     | `https://api.example.com`  |
| `ALLOWED_ORIGINS`  | `https://app.example.com`  |
| `LOG_LEVEL`        | `info`                     |

### Workflow Snippets

Add environment blocks to `test-frontend` and `test-backend` jobs in `.github/workflows/ci.yml`:

```yaml
  test-frontend:
    runs-on: ubuntu-latest
    env:
      VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
      VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
      VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
      VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
      VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
      VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      VITE_API_URL: ${{ vars.VITE_API_URL }}
      VITE_USE_EMULATORS: 'false'
```

```yaml
  test-backend:
    runs-on: ubuntu-latest
    env:
      FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
      FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
      FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
      FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
      GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      LOG_LEVEL: ${{ vars.LOG_LEVEL || 'info' }}
      ALLOWED_ORIGINS: ${{ vars.ALLOWED_ORIGINS || 'http://localhost:3000' }}
```

Commit workflow update once secrets exist. Missing secrets cause CI to fail before tests run.

## Deployment Steps

1. Confirm CI passes on main with new env blocks.  
2. Deploy frontend via Vercel (link project env to GitHub secrets or Vercel environment variables).  
3. Deploy backend via Cloud Run / Firebase Hosting using `backend/.env.production` or secret manager sync.  
4. Run smoke tests:
   - `yarn test:coverage`
   - `yarn workspace @daicer/frontend test:e2e`
5. Tag release and monitor logs for Firebase auth failures.

## Checklist Before Release

- [ ] `.env.example` and `backend/.env.example` reflect latest variables.  
- [ ] GitHub secrets + vars populated in Settings.  
- [ ] `.github/workflows/ci.yml` contains `env` blocks for both test jobs.  
- [ ] CI green on main.  
- [ ] Production environment overrides injected in Vercel/Cloud Run.  
- [ ] Release notes mention any new third-party keys.

