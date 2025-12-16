---
description: Configure Google Cloud Storage for Strapi (Public Access & Service Account)
---

# 1. Variables

export PROJECT_ID="daicer-ed373"
export BUCKET_NAME="daicer-media-library"
export SERVICE_ACCOUNT_NAME="strapi-upload"
export KEY_FILE="strapi-upload-key.json"

# 2. Make Bucket Public

# This command makes all objects in the bucket readable by anyone on the internet.

// turbo
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
 --member=allUsers \
 --role=roles/storage.objectViewer

# 3. Create Service Account

// turbo
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
 --display-name="Strapi Upload Service Account"

# 4. Grant Permissions to Service Account

# We grant Storage Admin role so it can upload/delete files.

// turbo
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
 --role="roles/storage.admin"

# 5. Generate Key File

# This downloads the JSON key needed for Strapi.

// turbo
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# 6. Output Config for .env

echo ""
echo "✅ Setup Complete!"
echo "---------------------------------------------------"
echo "Add the following to your backend/.env file (replacing existing values):"
echo ""
echo "GCS_BUCKET_NAME=$BUCKET_NAME"
echo "GCS_PUBLIC_FILES=true"
echo "GCS_UNIFORM=false"
echo "GCS_BASE_URL=https://storage.googleapis.com/$BUCKET_NAME"
echo "GCS_SERVICE_ACCOUNT='"
cat $KEY_FILE
echo "'"
echo "---------------------------------------------------"
