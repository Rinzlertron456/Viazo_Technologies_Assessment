# The 404 means Vercel can't find the project

The `vercel env rm` command needs to know the exact project name. Since your Vercel project is named `medibook` (set in `vercel.json`), you need to link the directory first or specify the project explicitly.

## Fix — run these commands in order:

```bash
# Step 1: Link the local directory to your Vercel project
cd Doctor-Appointment-Client
npx vercel link --project medibook --yes
```

```bash
# Step 2: Now remove the old env var
npx vercel env rm VITE_API_URL production --yes
```

```bash
# Step 3: Add the new env var with the correct backend URL
npx vercel env add VITE_API_URL production
```
Value: `https://medibook-api-1047653169613.us-central1.run.app/api`
Sensitive: `n`

```bash
# Step 4: Redeploy
npx vercel --prod --yes
```

The 404 occurred because you were in the `Doctor-Appointment-Client` folder but Vercel hadn't linked it to the `medibook` project yet (the `vercel.json` with the name was created during deployment, but the local folder still has the old folder name `Doctor-Appointment-Client` as far as Vercel's CLI tracking is concerned).

`vercel link --project medibook` creates a `.vercel` folder that tells the CLI which project you're working with, which resolves the 404.