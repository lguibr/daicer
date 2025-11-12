## Google Cloud Release Setup

This checklist configures the GitHub `Release` workflow to authenticate with Google Cloud Build and Cloud Run.

### 1. Confirm the service account
- Use or create a Google Cloud service account dedicated to CI/CD (no personal accounts).
- Grant minimum roles on the project:
  - `Cloud Build Editor`
  - `Artifact Registry Reader`
  - `Cloud Run Admin`
  - `Service Account User`
- Download the JSON key for this service account. Store it securely; never commit it.

### 2. Create GitHub secrets
- In the GitHub UI for the canonical repository (`Settings > Secrets and variables > Actions`):
  - Add secret `GCP_CLOUD_RUN_SA_KEY` with the **raw** JSON content from the service-account key.
  - Add secret `GCP_PROJECT_ID` with the Google Cloud project ID (e.g., `my-project-123`).
- Ensure the workflow runs from the primary repository (not a fork); GitHub blocks secrets for fork-triggered workflows.

### 3. Validate secret availability
- Push a throwaway git tag (e.g., `git tag test-release && git push origin test-release`) to trigger the `Release` workflow.
- In the workflow logs:
  - Step `Authenticate to Google Cloud` must complete without the “must specify exactly one of workload_identity_provider or credentials_json” error.
  - Step `Build & deploy backend via Cloud Build` should reach Cloud Build without authentication failures.
- Delete the throwaway tag afterwards (`git tag -d test-release && git push origin :refs/tags/test-release`).

### 4. Rotate credentials
- Delete the GitHub secret and replace it if the JSON key is rotated or suspected compromised.
- Revoke old keys in Google Cloud (`IAM & Admin > Service Accounts > [account] > KEYS`).

Proceed to configure Vercel once these checks pass.

