# Main Terraform configuration for D20 AI infrastructure

terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "d20ai-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "firestore.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudlogging.googleapis.com",
  ])

  service            = each.key
  disable_on_destroy = false
}

# Firestore database
resource "google_firestore_database" "main" {
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.apis]
}

# Service account for Cloud Run
resource "google_service_account" "backend" {
  account_id   = "d20ai-backend"
  display_name = "D20 AI Backend Service Account"
}

# IAM roles
resource "google_project_iam_member" "backend_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Secrets
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "GEMINI_API_KEY"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "firebase_private_key" {
  secret_id = "FIREBASE_PRIVATE_KEY"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# Cloud Run service
resource "google_cloud_run_service" "backend" {
  name     = "d20ai-backend"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.backend.email

      containers {
        image = "gcr.io/${var.project_id}/d20ai-backend:latest"

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "FIREBASE_PROJECT_ID"
          value = var.project_id
        }

        env {
          name = "GEMINI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.gemini_api_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "FIREBASE_PRIVATE_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.firebase_private_key.secret_id
              key  = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "2"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.apis]
}

# Allow unauthenticated access
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

