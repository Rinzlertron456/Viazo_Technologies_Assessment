#!/usr/bin/env bash
# =============================================================================
# MediBook — Deployment Script
# =============================================================================
# Prerequisites:
#   1. Google Cloud CLI installed and authenticated (`gcloud auth login`)
#   2. Vercel CLI installed and authenticated (`npx vercel login`)
#   3. Docker installed and running
#   4. GCP project with Cloud Run + Cloud Storage APIs enabled
#   5. MongoDB Atlas cluster created and connection string ready
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# =============================================================================

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION — Fill these in before running
# ═══════════════════════════════════════════════════════════════════════════════

GCP_PROJECT_ID="appointment-booking-app-501907"

# Ensure gcloud is using the correct project
gcloud config set project "${GCP_PROJECT_ID}" 2>/dev/null || true
GCP_REGION="us-central1"
SERVICE_NAME="medibook-api"
ARTIFACT_REPO_NAME="medibook-repo"

# Use Artifact Registry (Docker format) — this is the default for new GCP projects
IMAGE_NAME="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REPO_NAME}/${SERVICE_NAME}"


MONGODB_URI="mongodb+srv://lodestone1919_db_user:1s613pikjK0UY25P@fullstackapp.ph7hpv7.mongodb.net/?appName=FullStackApp"

# After deploy, replace with your actual Vercel domain:
CLIENT_URL="https://medibook-gilt.vercel.app"

# Auto-generated JWT secrets (32 hex bytes each)
JWT_ACCESS_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

GCS_BUCKET_NAME="medibook-uploads-${GCP_PROJECT_ID}"

# ═══════════════════════════════════════════════════════════════════════════════
# SMTP / EMAIL — Options (choose ONE method, leave others empty)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Option A: Resend (FREE — 100 emails/day, no credit card needed)
#   Go to https://resend.com → Sign up → Get API Key
#   Then set:
#     SMTP_HOST="smtp.resend.com"
#     SMTP_PORT="465"
#     SMTP_USER="resend"
#     SMTP_PASS="re_xxxxxxxxxxxx"  ← your Resend API key
#     SMTP_FROM="MediBook <noreply@yourdomain.com>"
#
# Option B: SendGrid (FREE — 100 emails/day)
#   Go to https://sendgrid.com → Sign up → Create API Key
#   Then set:
#     SMTP_HOST="smtp.sendgrid.net"
#     SMTP_PORT="587"
#     SMTP_USER="apikey"
#     SMTP_PASS="SG.xxxxxxxxx"  ← your SendGrid API key
#     SMTP_FROM="noreply@medibook.com"
#
# Option C: Brevo (FREE — 300 emails/day)
#   Go to https://brevo.com → Sign up → Get SMTP key
#     SMTP_HOST="smtp-relay.brevo.com"
#     SMTP_PORT="587"
#     SMTP_USER="your@email.com"
#     SMTP_PASS="xsmtpsib-xxxxx"
#
# If you leave ALL SMTP_* empty, emails will only be logged to the console.
# =============================================================================

SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"
SMTP_USER="resend"
SMTP_PASS="re_KWnGpajn_6GvF2oAYU63UqWDNRYCepHey"
SMTP_FROM="noreply@medibook.com"

# ═══════════════════════════════════════════════════════════════════════════════
# GOOGLE OAUTH — For "Sign in with Google" button
# ═══════════════════════════════════════════════════════════════════════════════
#
# How to set up (FREE):
#   1. Go to https://console.cloud.google.com/apis/credentials
#   2. Select your project: appointment-booking-app-501907
#   3. Click "Create Credentials" → "OAuth client ID"
#   4. Application type → "Web application"
#   5. Name: "MediBook Web Client"
#   6. Authorized JavaScript origins:
#        - http://localhost:5173          (dev)
#        - https://medibook.vercel.app    (prod)
#   7. Authorized redirect URIs:
#        - http://localhost:5173/login
#        - https://medibook.vercel.app/login
#   8. Click Create → copy the Client ID below
#
# If this is empty, the Google Sign-In button will simply not appear.
# =============================================================================

GOOGLE_CLIENT_ID="1047653169613-a4133bh0g63odhmg5v06qj94i8j5eth5.apps.googleusercontent.com"
RECAPTCHA_ENABLED="false"
RECAPTCHA_SECRET=""

# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOYMENT STEPS — Do not modify below unless you know what you're doing
# ═══════════════════════════════════════════════════════════════════════════════

# ── Step 1: Build image via Google Cloud Build (no Docker Desktop needed) ───────
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STEP 1/4 — Building image via Google Cloud Build           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo "→ Image name: ${IMAGE_NAME}"

# Enable Artifact Registry API and create Docker repository if needed
echo "→ Ensuring Artifact Registry API is enabled..."
gcloud services enable artifactregistry.googleapis.com --project="${GCP_PROJECT_ID}" --quiet 2>/dev/null || true

echo "→ Ensuring Docker repository exists..."
gcloud artifacts repositories describe "${ARTIFACT_REPO_NAME}" \
  --location="${GCP_REGION}" \
  --project="${GCP_PROJECT_ID}" 2>/dev/null || \
gcloud artifacts repositories create "${ARTIFACT_REPO_NAME}" \
  --repository-format=docker \
  --location="${GCP_REGION}" \
  --project="${GCP_PROJECT_ID}" \
  --description="Docker repository for MediBook"

echo "→ Cloud Build will detect the Dockerfile and build + push automatically"

gcloud builds submit \
  --tag "${IMAGE_NAME}" \
  --timeout="15m" \
  Doctor-Appointment-Server/

echo "✓ Image built and pushed to Artifact Registry via Cloud Build"

# ── Step 2: Create GCS bucket for file uploads ──────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STEP 2/4 — Setting up Google Cloud Storage bucket          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

if ! gcloud storage buckets describe "gs://${GCS_BUCKET_NAME}" 2>/dev/null; then
  gcloud storage buckets create "gs://${GCS_BUCKET_NAME}" --location="${GCP_REGION}"
  gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET_NAME}" \
    --member="allUsers" \
    --role="roles/storage.objectViewer"
  echo "✓ Bucket created: ${GCS_BUCKET_NAME}"
else
  echo "→ Bucket already exists: ${GCS_BUCKET_NAME}"
fi


# ── Step 3: Deploy to Cloud Run ─────────────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STEP 3/4 — Deploying backend to Cloud Run                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

# Build the --set-env-vars argument list
ENV_VARS="NODE_ENV=production"
ENV_VARS="${ENV_VARS},MONGODB_URI=${MONGODB_URI}"
ENV_VARS="${ENV_VARS},CLIENT_URL=${CLIENT_URL}"
ENV_VARS="${ENV_VARS},JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}"
ENV_VARS="${ENV_VARS},JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}"
ENV_VARS="${ENV_VARS},JWT_ACCESS_EXPIRY=${JWT_ACCESS_EXPIRY}"
ENV_VARS="${ENV_VARS},JWT_REFRESH_EXPIRY=${JWT_REFRESH_EXPIRY}"
ENV_VARS="${ENV_VARS},GCS_BUCKET_NAME=${GCS_BUCKET_NAME}"
ENV_VARS="${ENV_VARS},GCP_PROJECT_ID=${GCP_PROJECT_ID}"

# SMTP (only add if configured)
if [ -n "${SMTP_HOST}" ]; then
  ENV_VARS="${ENV_VARS},SMTP_HOST=${SMTP_HOST}"
  ENV_VARS="${ENV_VARS},SMTP_PORT=${SMTP_PORT}"
  ENV_VARS="${ENV_VARS},SMTP_USER=${SMTP_USER}"
  ENV_VARS="${ENV_VARS},SMTP_PASS=${SMTP_PASS}"
  ENV_VARS="${ENV_VARS},SMTP_FROM=${SMTP_FROM}"
fi

# Google OAuth (only add if configured)
if [ -n "${GOOGLE_CLIENT_ID}" ]; then
  ENV_VARS="${ENV_VARS},GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
  ENV_VARS="${ENV_VARS},RECAPTCHA_ENABLED=${RECAPTCHA_ENABLED}"
  if [ -n "${RECAPTCHA_SECRET}" ]; then
    ENV_VARS="${ENV_VARS},RECAPTCHA_SECRET=${RECAPTCHA_SECRET}"
  fi
fi

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --platform managed \
  --region "${GCP_REGION}" \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars "${ENV_VARS}"

echo "✓ Cloud Run service deployed"

# Get the Cloud Run URL
API_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --platform managed \
  --region "${GCP_REGION}" \
  --format 'value(status.url)')

echo "→ API URL: ${API_URL}"

# ── Step 4: Deploy Frontend to Vercel ───────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STEP 4/4 — Deploying frontend to Vercel                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

cd Doctor-Appointment-Client

# Set VITE_API_URL as a Vercel environment variable (production only)
npx vercel env add VITE_API_URL production <<< "${API_URL}/api" 2>/dev/null || \
  echo "→ VITE_API_URL already set or skipped"

# Deploy to production with explicit project name (the folder name "Doctor-Appointment-Client"
# can contain invalid characters for Vercel, so we override it)
npx vercel --name medibook --prod --yes 2>/dev/null || \
  npx vercel --prod --yes

cd ..

echo "✓ Frontend deployed to Vercel"

# ── Summary ──────────────────────────────────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETE                                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "   Frontend : https://medibook.vercel.app"
echo "   Backend  : ${API_URL}"
echo "   Health   : ${API_URL}/api/health"
echo ""
echo "   ── Test Credentials ──"
echo "   SuperAdmin   → superadmin@medibook.com / Admin@123"
echo "   Admin        → admin@medibook.com / Admin@123"
echo "   Doctor       → doctor@medibook.com / Doctor@123"
echo "   Receptionist → reception@medibook.com / Recept@123"
echo "   Patient      → patient@medibook.com / Patie@123"
echo ""
echo "   ── Post-Deploy Checklist ──"
echo "   [ ] 1. Set up email SMTP (see SMTP section above)"
echo ""
echo "   [ ] 2. Configure Google OAuth for 'Sign in with Google'"
echo "         → https://console.cloud.google.com/apis/credentials"
echo "         → Add these to Authorized JavaScript origins:"
echo "             • https://medibook.vercel.app"
echo "         → Add to redirect URIs:"
echo "             • https://medibook.vercel.app/login"
echo "         → Then re-run: gcloud run deploy ${SERVICE_NAME} \\"
echo "             --set-env-vars \"GOOGLE_CLIENT_ID=your-id\""
echo ""
echo "   [ ] 3. (Optional) Point a custom domain to Vercel"
echo "         → Vercel dashboard → medibook project → Domains"
echo ""
echo "   [ ] 4. (Optional) Point api.yourdomain.com to Cloud Run"
echo "         → gcloud run domain-mappings create \\"
echo "             --service ${SERVICE_NAME} \\"
echo "             --region ${GCP_REGION} \\"
echo "             --domain api.yourdomain.com"
echo ""
echo "   [ ] 5. Verify health endpoint responds:"
echo "         curl ${API_URL}/api/health"
echo ""
