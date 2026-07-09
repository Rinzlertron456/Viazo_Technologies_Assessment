# CORS Error — Cloud Run thinks your frontend is at `medibook.vercel.app` but it's at `medibook-gilt.vercel.app`

The error says it all:
```
Access-Control-Allow-Origin has a value 'https://medibook.vercel.app' 
but the request comes from 'https://medibook-gilt.vercel.app'
```

The `CLIENT_URL` env var in Cloud Run is set to `https://medibook.vercel.app` but Vercel generated a different URL for you (`medibook-gilt.vercel.app`).

## Fix — update the CLIENT_URL env var on Cloud Run

Run this one command:

```bash
gcloud run deploy medibook-api \
  --region us-central1 \
  --update-env-vars "CLIENT_URL=https://medibook-gilt.vercel.app" \
  --no-traffic
```

Then:
```bash
gcloud run services update-traffic medibook-api \
  --region us-central1 \
  --to-latest
```

Or if you want a single combined command:

```bash
gcloud run deploy medibook-api \
  --region us-central1 \
  --image us-central1-docker.pkg.dev/appointment-booking-app-501907/medibook-repo/medibook-api \
  --update-env-vars "CLIENT_URL=https://medibook-gilt.vercel.app"
```

This updates just the env var without rebuilding the container. After this, CORS will allow your actual Vercel domain and login will work.

Then also update `deploy.sh` line that sets `CLIENT_URL` so future deploys use the right value:

```bash
# Change this in deploy.sh from:
CLIENT_URL="https://medibook.vercel.app"
# To:
CLIENT_URL="https://medibook-gilt.vercel.app"
```

### For the Google OAuth error
Same root cause — go to https://console.cloud.google.com/apis/credentials, edit your OAuth client, and add `https://medibook-gilt.vercel.app` to Authorized JavaScript origins.