# Step 1 succeeded! Now Step 2 needs a fix

Great news — the Docker image built and pushed to Artifact Registry successfully! The only blocker now is that `gsutil` requires Python 3, which isn't available in your Git Bash environment.

## Fix: Replace `gsutil` with `gcloud storage`

`gsutil` is the old tool that needs Python. Google's modern CLI uses `gcloud storage` which doesn't need Python and works everywhere `gcloud` works.

Replace Step 2 in `deploy.sh` with:

```bash
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
```

This uses `gcloud storage` (the modern replacement for `gsutil`) which runs on the same gcloud infrastructure you already authenticated. No Python needed.

After replacing that block in `deploy.sh`, run `bash deploy.sh` again and it should flow all the way through to Vercel deployment.