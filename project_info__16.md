# Root cause: The deployment is landing on a different Vercel project

You have **two different Vercel projects**:

1. **`medibook`** — The project name set in `vercel.json`. When you run `npx vercel --prod --yes`, Vercel asks "Which scope?" and "Link to existing project?" If you answer "no" or choose wrong, it creates a **new project** on Vercel with a fresh random URL like `medibook-xxx.vercel.app` — which has the new code and works.

2. **`medibook-gilt`** — The production URL you've been using. This is the **original project** on Vercel, but it's NOT linked to your local folder, so `npx vercel --prod --yes` deploys to the *new* project, not the old one.

## The fix: Link your local folder to the correct project

```bash
cd Doctor-Appointment-Client
npx vercel link --project medibook-gilt --yes
npx vercel --prod --yes
```

This tells Vercel: "Use the existing `medibook-gilt` project, don't create a new one." The deployment goes to the correct production URL.

## Check which project you're deploying to

Run this to see what projects you have:
```bash
npx vercel projects list
```

You'll likely see both `medibook` and `medibook-gilt`. The `--project` flag in `vercel link` picks the right one.