#!/bin/bash
export PROJECT_ID="daicer-ed373"
export BUCKET_NAME="daicer-media-library"
export SERVICE_ACCOUNT_NAME="strapi-upload"
export KEY_FILE="strapi-upload-key.json"

echo "Making bucket public..."
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
    --member=allUsers \
    --role=roles/storage.objectViewer

echo "Creating service account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="Strapi Upload Service Account"

echo "Granting permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

echo "Generating key..."
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "Done."
