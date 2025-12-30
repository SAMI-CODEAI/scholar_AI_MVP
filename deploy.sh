#!/bin/bash
set -e

# Configuration
PROJECT_ID="medkey-vault"
SERVICE_NAME="scholar-ai-backend"
REGION="us-central1"

echo "🚀 Starting Deployment Process for Scholar AI..."
echo "---------------------------------------------"

# 1. Frontend Build
echo "📦 Building Angular Frontend..."
cd frontend-angular
npm install --legacy-peer-deps
npm run build --configuration=production
cd ..

# 2. Backend Deployment (Cloud Run)
echo "☁️  Deploying Backend to Cloud Run..."
echo "   (This may take a few minutes and require you to login if not authenticated)"

# Deploy to Cloud Run
/opt/homebrew/bin/gcloud builds submit backend-functions --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --project $PROJECT_ID --quiet

/opt/homebrew/bin/gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GCS_BUCKET_NAME=$PROJECT_ID.appspot.com \
  --project $PROJECT_ID \
  --quiet

echo "✅ Backend Deployed Successfully!"

# 3. Firebase Hosting Deployment
echo "🔥 Deploying Frontend to Firebase Hosting..."
cd frontend-angular
/Users/devanshvpurohit/.nvm/versions/node/v22.20.0/bin/firebase deploy --only hosting

echo "---------------------------------------------"
echo "🎉 Deployment Complete!"
echo "Your app should be live at: https://$PROJECT_ID.web.app"
