# Daicer Infrastructure (CDKTF)

TypeScript CDK for Terraform stack managing Daicer backend on GCP Cloud Run.

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.deployment.example .env

# Edit .env with your GCP settings
# Minimum required:
# - GCP_PROJECT_ID=daicer-ed373
# - GCP_REGION=us-central1
```

### 2. Run from Root

All commands available from repository root:

```bash
# Install dependencies
yarn infra:install

# Preview infrastructure changes
yarn infra:diff

# Deploy infrastructure
yarn infra:deploy

# Full deployment (backend + infra + frontend)
yarn deploy:all
```

## Available Root Commands

```bash
yarn infra:install    # Install infra dependencies
yarn infra:synth      # Generate Terraform config
yarn infra:diff       # Preview changes
yarn infra:deploy     # Deploy to GCP
yarn infra:destroy    # Destroy infrastructure

yarn deploy:backend   # Build & push Docker image
yarn deploy:infra     # Deploy Cloud Run service
yarn deploy:frontend  # Deploy to Firebase Hosting
yarn deploy:all       # Full deployment pipeline
```

## Environment Variables

All scripts read from `.env` in repository root:

- `GCP_PROJECT_ID` - GCP project ID (default: daicer-ed373)
- `GCP_REGION` - GCP region (default: us-central1)
- `BACKEND_IMAGE` - Container image URL
- `GOOGLE_CREDENTIALS` - Service account JSON (for auth)
- `GEMINI_API_KEY` - Optional, for secret creation
- `FIREBASE_PRIVATE_KEY` - Optional, for secret creation

## Prerequisites

- Node.js 22+
- Terraform >= 1.6.0
- CDKTF CLI: `npm install -g cdktf-cli@latest`
- GCP CLI authenticated: `gcloud auth application-default login`

## What Gets Deployed

1. **Cloud Run v2 Service** (`daicer-backend`)
   - Container from GCR/Artifact Registry
   - Port 8080
   - Auto-scaling: 0-10 instances
   - Public ingress (unauthenticated)

2. **Secret Manager Secrets**
   - `GEMINI_API_KEY`
   - `FIREBASE_PRIVATE_KEY`

3. **Service Account**
   - `daicer-backend-sa@daicer-ed373.iam.gserviceaccount.com`
   - Roles: `secretmanager.secretAccessor`

4. **IAM Bindings**
   - Service account can access secrets

## Outputs

After deployment, outputs are available:

```bash
cd infra/cdktf.out/stacks/daicer-infra
terraform output
```

- `backend_url` - Cloud Run service URL
- `service_account_email` - Service account email
- `gemini_secret_name` - Secret Manager secret ID
- `firebase_secret_name` - Secret Manager secret ID

## Local Development Workflow

```bash
# 1. Authenticate to GCP
gcloud auth application-default login
gcloud config set project daicer-ed373

# 2. Set environment variables (or use .env)
export GCP_PROJECT_ID=daicer-ed373

# 3. Build & deploy backend
yarn deploy:backend

# 4. Deploy infrastructure
yarn infra:deploy

# 5. Deploy frontend
yarn deploy:frontend

# Or do all at once
yarn deploy:all
```

## CI/CD

See `.github/workflows/deploy.yml` for GitHub Actions integration.

GitHub Actions requires secrets:

- `GCP_SA_KEY` - Service account JSON
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON

## Troubleshooting

### CDKTF Deploy Fails

```bash
cd infra
yarn synth  # Check for syntax errors

cd cdktf.out/stacks/daicer-infra
terraform state list  # Check state
terraform plan  # See what will change
```

### Environment Variables Not Loading

```bash
# Verify .env exists in repository root
cat .env

# Check if dotenv is loading
cd infra
node -e "require('dotenv').config({path:'../.env'}); console.log(process.env.GCP_PROJECT_ID)"
```

## Manual Commands (if needed)

If you need to run commands directly in the infra directory:

```bash
cd infra

# Install
yarn install

# Synthesize
yarn synth

# Deploy (with env vars)
export GCP_PROJECT_ID=daicer-ed373
export BACKEND_IMAGE=gcr.io/daicer-ed373/daicer-backend:latest
yarn deploy

# Destroy
yarn destroy
```
