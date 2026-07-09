Let me quickly verify the current state of your deployments.

**1. Check if Cloud Run has the correct CLIENT_URL:**

Run this command to verify:
```bash
gcloud run services describe medibook-api --region us-central1 --format='value(status.url)'
gcloud run services describe medibook-api --region us-central1 --format='table(spec.template.spec.containers[0].env)'
```

**2. Check what VITE_API_URL is set to on Vercel:**

Run this:
```bash
cd Doctor-Appointment-Client
npx vercel env ls
```

**3. The Google OAuth problem:**

Your deployed frontend's URL is `https://medibook-gilt-woad.vercel.app` but your OAuth client ID in the Google Cloud Console likely has `https://medibook.vercel.app` as an authorized origin (not the `-woad` variant). Every time Vercel creates a preview deployment, it generates a new URL with random suffixes. You need to add your **actual production URL** to the Google OAuth client's authorized JavaScript origins.

**Here's the bulletproof fix:**

### Step 1: Get the correct env values
```bash
# Get Cloud Run URL
gcloud run services describe medibook-api --region us-central1 --format='value(status.url)'
```

### Step 2: Set VITE_API_URL on Vercel correctly
```bash
cd Doctor-Appointment-Client
npx vercel env rm VITE_API_URL production --yes
npx vercel env add VITE_API_URL production
# Value: https://medibook-api-1047653169613.us-central1.run.app/api
# Sensitive: n
```

### Step 3: Redeploy frontend
```bash
npx vercel --prod --yes
```

### Step 4: Fix Google OAuth
Go to https://console.cloud.google.com/apis/credentials → Click your OAuth 2.0 Client ID → Under "Authorized JavaScript origins" add:
```
https://medibook-gilt-woad.vercel.app
```
Also add the local dev origin:
```
http://localhost:5173
```

The "doesn't comply with OAuth 2.0 policy" error often means the `GOOGLE_CLIENT_ID` in your deploy.sh env vars points to an OAuth client that doesn't have your deployment URL whitelisted. Add the URL above and it will work.

### Why "Unable to reach the server" keeps appearing
This happens when `VITE_API_URL` is empty on Vercel and the frontend falls back to `http://localhost:5000/api`. The `npx vercel env add` command must be run from the **linked project directory** that points to `medibook-gilt` (not medibook). Run `npx vercel link` first to ensure you're linked to the correct project, then add the env var.

Let me provide exact commands you can paste one by one.