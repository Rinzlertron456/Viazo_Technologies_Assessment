# Root Cause: Compute Engine default service account lacks Storage access

The error says:
```
1047653169613-compute@developer.gserviceaccount.com does not have storage.objects.get access
```

Cloud Build uploads your source to a GCS bucket, then the **Compute Engine default service account** needs to read it back to run the build. That account is missing the `storage.objectViewer` role.

## Fix — run this ONE command:

```bash
gcloud projects add-iam-policy-binding appointment-booking-app-501907 \
  --member="serviceAccount:1047653169613-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

Then retry:
```bash
bash deploy.sh
```

## Why this happened

Your project is relatively new, and the Compute Engine default service account (`*-compute@developer.gserviceaccount.com`) gets created automatically but doesn't get Storage access by default when Cloud Build is enabled after the fact. One IAM binding fixes it permanently.

## Alternative if that still fails

If the above doesn't work, the Cloud Build service account might be different. Try this instead:

```bash
gcloud projects add-iam-policy-binding appointment-booking-app-501907 \
  --member="serviceAccount:service-1047653169613@gcp-sa-cloudbuild.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

**These are GCP IAM fixes, not code changes.** Everything in the repo is ready to deploy — just need this permission granted once.