# Deployment Playbook

## Overview

- Backend: Google Cloud Run + Firestore.
- Frontend: Vercel.
- Seeds: TypeScript scripts under `seeds/scripts`.

## CI/CD Automation

### GitHub Actions Workflows

- `ci.yml`: format, lint, type-check, tests, and build on every PR/branch push.
- `release.yml`: production deploy when a tag prefixed with `v` is pushed.

### Required Repository Secrets

| Secret                 | Description                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`       | Google Cloud project hosting Firestore + Cloud Run.                                                                                                       |
| `GCP_CLOUD_RUN_SA_KEY` | JSON credentials for a service account with `Cloud Build Editor`, `Cloud Run Admin`, `Artifact Registry Administrator`, `Secret Manager Secret Accessor`. |
| `VERCEL_TOKEN`         | Personal or team token with deploy permission.                                                                                                            |
| `VERCEL_ORG_ID`        | Vercel scope ID (team or personal).                                                                                                                       |
| `VERCEL_PROJECT_ID`    | Vercel project identifier for the frontend.                                                                                                               |

### Tag-driven Production Release

```bash
# ensure main is merged and CI green
git checkout main
git pull origin main

# tag and push
git tag v1.2.3
git push origin v1.2.3
```

The `release.yml` workflow will:

1. Authenticate to Google Cloud.
2. Submit `backend/cloudbuild.yaml` (builds, pushes, and deploys to Cloud Run).
3. Run `seeds/cloudbuild.seed.yaml` to populate Firestore.
4. Deploy the latest frontend to Vercel using the production environment.

### Local Smoke Deploy (staging or testing)

```bash
# backend container + deploy
gcloud builds submit --config backend/cloudbuild.yaml --project <PROJECT_ID>

# run seeds after successful deploy
gcloud builds submit \
  --config seeds/cloudbuild.seed.yaml \
  --project <PROJECT_ID> \
  --substitutions _FIREBASE_PROJECT_ID=<PROJECT_ID>

# frontend preview deploy
npm install -g vercel@latest
vercel pull --yes --environment=preview --token "$VERCEL_TOKEN" --scope "$VERCEL_ORG_ID" --project "$VERCEL_PROJECT_ID" --cwd frontend
vercel deploy --prebuilt --token "$VERCEL_TOKEN" --scope "$VERCEL_ORG_ID" --project "$VERCEL_PROJECT_ID" --cwd frontend
```

## Backend on Google Cloud

### Prerequisites

- Project with `Cloud Run`, `Cloud Build`, and `Artifact Registry` enabled.
- Service account `daicer-ci` with `Cloud Build Editor`, `Cloud Run Admin`, `Storage Admin`, and `Secret Manager Secret Accessor`.
- Secrets in Secret Manager: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `FIREBASE_PRIVATE_KEY`.
- Firestore database in production mode.

### Build and Deploy

```bash
gcloud builds submit \
  --project <PROJECT_ID> \
  --config backend/cloudbuild.yaml
```

Cloud Build steps:

- Build container with `backend/Dockerfile`.
- Push to `gcr.io/<PROJECT_ID>/daicer-backend`.
- Deploy to Cloud Run service `daicer-backend` in `us-central1`.

### Runtime Configuration

| Variable                  | Value                            |
| ------------------------- | -------------------------------- |
| `PORT`                    | `8080` (Cloud Run default)       |
| `NODE_ENV`                | `production`                     |
| `FIREBASE_PROJECT_ID`     | `<PROJECT_ID>`                   |
| `FIREBASE_STORAGE_BUCKET` | `<PROJECT_ID>.appspot.com`       |
| `ALLOWED_ORIGINS`         | Comma-separated frontend origins |
| `LOG_LEVEL`               | `info` or `debug`                |

Secrets mapped via `--set-secrets`:

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `FIREBASE_PRIVATE_KEY`

### Rollback

```bash
gcloud run services list-revisions --service daicer-backend --region us-central1
gcloud run services update-traffic daicer-backend \
  --region us-central1 \
  --to-revisions <REVISION>=100
```

## Firestore Seeding

### Local

```bash
cd backend
FIREBASE_PROJECT_ID=<PROJECT_ID> \
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
yarn seed
```

- Aggregated script runs `seed:gamedata`, `seed:srd`, `seed:spells`.
- Supply Application Default Credentials with Firestore access.

### Cloud Build Job

Use `seeds/cloudbuild.seed.yaml`.

```bash
gcloud builds submit \
  --project <PROJECT_ID> \
  --config seeds/cloudbuild.seed.yaml \
  --substitutions _FIREBASE_PROJECT_ID=<PROJECT_ID>
```

Grant the Cloud Build service account access to `Secret Manager Secret Accessor` and `Cloud Datastore User` so Firebase Admin can authenticate against Firestore.

## Frontend on Vercel

### Project Settings

- Framework preset: `Vite`.
- Root directory: `frontend`.
- Install command: `yarn install --frozen-lockfile`.
- Build command: `yarn build`.
- Output directory: `dist`.
- Node version: `22.x`.

### Environment Variables

| Key                                 | Value                          |
| ----------------------------------- | ------------------------------ |
| `VITE_API_URL`                      | Cloud Run backend URL          |
| `VITE_SOCKET_URL`                   | Same as API URL                |
| `VITE_FIREBASE_PROJECT_ID`          | `<PROJECT_ID>`                 |
| `VITE_FIREBASE_API_KEY`             | Firebase Web API key           |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `<PROJECT_ID>.firebaseapp.com` |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `<PROJECT_ID>.appspot.com`     |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase                  |
| `VITE_FIREBASE_APP_ID`              | From Firebase                  |
| `VITE_USE_EMULATORS`                | `false`                        |

Sync env vars between Preview and Production. Use Vercel integrations to pull from `.env.production` if stored in GitHub.

### Deployment Flow

- Connect Vercel project to GitHub repository.
- Auto-deploy Preview for every PR (`feature/**`, `hotfix/**`, etc.).
- Promote to Production on merge to `main`.
- Use Vercel git protection to require passing CI before promotion.

### Rollback

```bash
vercel deploy --prod --archive <deployment-url>
```

Or use Vercel dashboard “Promote to Production” on previous deployment.

## Observability Checklist

- Cloud Run logs exported to Cloud Logging sink with severity filter.
- Firestore export schedule (daily) using `gcloud scheduler jobs update`.
- Vercel Analytics enabled for production project.
- Synthetic ping using `gcloud scheduler jobs create http` hitting `/health`.

## Incident Response

- Triage via Cloud Monitoring alerts.
- Rollback backend or frontend as above.
- Re-run seeds only if Firestore was reset.
- Document root cause in `docs/incidents/<date>-<slug>.md` (create folder if absent).
