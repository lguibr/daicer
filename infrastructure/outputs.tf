# Terraform outputs

output "backend_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_service.backend.status[0].url
}

output "firestore_database" {
  description = "Firestore database name"
  value       = google_firestore_database.main.name
}

output "service_account_email" {
  description = "Backend service account email"
  value       = google_service_account.backend.email
}

