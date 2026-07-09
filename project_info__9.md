# Root Cause: Your project uses Artifact Registry, not Container Registry

The Docker image **built successfully** (all 18 steps passed, TypeScript compiled, `npm ci` passed). The failure is only at the **PUSH** stage:

```
denied: Permission 'artifactregistry.repositories.uploadArtifacts' denied
```

New GCP projects (created after 2023) use **Artifact Registry** by default, not the legacy **Container Registry** (`gcr.io`). Your Cloud Build service account needs the Artifact Registry Writer role.

## Fix — run these TWO commands:

```bash
# Give the build service account permission to push Docker images
gcloud projects add-iam-policy-binding appointment-booking-app-501907 \
  --member="serviceAccount:1047653169613-compute@developer.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Also fix the logging permission warning from the build output
gcloud projects add-iam-policy-binding appointment-booking-app-501907 \
  --member="serviceAccount:1047653169613-compute@developer.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

Then retry:
```bash
bash deploy.sh
```

## What will happen

The same build will re-run, but this time the PUSH will succeed because the service account now has `artifactregistry.repositories.uploadArtifacts` permission. Everything else (Dockerfile, TypeScript build, npm install) already passed cleanly.

---

## Longer-term: Consider switching to Artifact Registry repo

If you want to avoid this permanently, you can create a dedicated Artifact Registry Docker repository and change the image tag from `gcr.io/...` to `us-central1-docker.pkg.dev/...`. But for now, adding the IAM role above is the simplest fix.