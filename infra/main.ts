import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import {
  provider,
  cloudRunV2Service,
  secretManagerSecret,
  secretManagerSecretVersion,
  serviceAccount,
  projectIamMember,
  dataGoogleProject,
} from '@cdktf/provider-google';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from repository root
config({ path: resolve(__dirname, '../.env') });

/**
 * Stack for Daicer backend on Cloud Run with Secret Manager.
 *
 * Expects env vars:
 * - GCP_PROJECT_ID (defaults to daicer-ed373)
 * - GCP_REGION (defaults to us-central1)
 * - BACKEND_IMAGE (container image for daicer-backend)
 * - GEMINI_API_KEY (optional, for creating secret)
 * - FIREBASE_PRIVATE_KEY (optional, for creating secret)
 */
class DaicerInfraStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const projectId = process.env.GCP_PROJECT_ID || 'daicer-ed373';
    const region = process.env.GCP_REGION || 'us-central1';
    const backendImage = process.env.BACKEND_IMAGE || `gcr.io/${projectId}/daicer-backend:latest`;

    // Google provider
    new provider.GoogleProvider(this, 'google', {
      project: projectId,
      region,
    });

    // Get project data for IAM bindings
    const project = new dataGoogleProject.DataGoogleProject(this, 'project', {
      projectId,
    });

    // Create service account for Cloud Run
    const backendServiceAccount = new serviceAccount.ServiceAccount(this, 'backend-sa', {
      accountId: 'daicer-backend-sa',
      displayName: 'Daicer Backend Service Account',
      description: 'Service account for daicer-backend Cloud Run service',
    });

    // Grant Secret Manager accessor role to service account
    new projectIamMember.ProjectIamMember(this, 'backend-sa-secret-accessor', {
      project: projectId,
      role: 'roles/secretmanager.secretAccessor',
      member: `serviceAccount:${backendServiceAccount.email}`,
    });

    // Create Secret Manager secrets
    const geminiSecret = new secretManagerSecret.SecretManagerSecret(this, 'gemini-api-key', {
      secretId: 'GEMINI_API_KEY',
      replication: {
        auto: {},
      },
      labels: {
        app: 'daicer',
        component: 'backend',
      },
    });

    const firebaseSecret = new secretManagerSecret.SecretManagerSecret(this, 'firebase-private-key', {
      secretId: 'FIREBASE_PRIVATE_KEY',
      replication: {
        auto: {},
      },
      labels: {
        app: 'daicer',
        component: 'backend',
      },
    });

    // Only create secret versions if values are provided in env vars
    // Otherwise, these should be set manually via GCP Console or gcloud CLI
    if (process.env.GEMINI_API_KEY) {
      new secretManagerSecretVersion.SecretManagerSecretVersion(this, 'gemini-api-key-version', {
        secret: geminiSecret.id,
        secretData: process.env.GEMINI_API_KEY,
      });
    }

    if (process.env.FIREBASE_PRIVATE_KEY) {
      new secretManagerSecretVersion.SecretManagerSecretVersion(this, 'firebase-private-key-version', {
        secret: firebaseSecret.id,
        secretData: process.env.FIREBASE_PRIVATE_KEY,
      });
    }

    // Cloud Run v2 service
    const backend = new cloudRunV2Service.CloudRunV2Service(this, 'daicer-backend', {
      name: 'daicer-backend',
      location: region,
      ingress: 'INGRESS_TRAFFIC_ALL',

      template: {
        serviceAccount: backendServiceAccount.email,
        containers: [
          {
            image: backendImage,
            ports: {
              containerPort: 8080,
            },

            env: [
              {
                name: 'NODE_ENV',
                value: 'production',
              },
              {
                name: 'PORT',
                value: '8080',
              },
              {
                name: 'GEMINI_API_KEY',
                valueSource: {
                  secretKeyRef: {
                    secret: geminiSecret.secretId,
                    version: 'latest',
                  },
                },
              },
              {
                name: 'FIREBASE_PRIVATE_KEY',
                valueSource: {
                  secretKeyRef: {
                    secret: firebaseSecret.secretId,
                    version: 'latest',
                  },
                },
              },
            ],

            resources: {
              limits: {
                cpu: '1',
                memory: '512Mi',
              },
            },
          },
        ],

        scaling: {
          minInstanceCount: 0,
          maxInstanceCount: 10,
        },
      },

      traffic: [
        {
          type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST',
          percent: 100,
        },
      ],
    });

    // Output the backend URL
    new TerraformOutput(this, 'backend_url', {
      value: backend.uri,
      description: 'Cloud Run service URL for daicer-backend',
    });

    // Output service account email
    new TerraformOutput(this, 'service_account_email', {
      value: backendServiceAccount.email,
      description: 'Service account email for Cloud Run',
    });

    // Output secret names
    new TerraformOutput(this, 'gemini_secret_name', {
      value: geminiSecret.secretId,
      description: 'Secret Manager secret ID for Gemini API key',
    });

    new TerraformOutput(this, 'firebase_secret_name', {
      value: firebaseSecret.secretId,
      description: 'Secret Manager secret ID for Firebase private key',
    });
  }
}

const app = new App();
new DaicerInfraStack(app, 'daicer-infra');
app.synth();
