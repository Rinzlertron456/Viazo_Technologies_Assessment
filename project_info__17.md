# Build error 127 — "vite build" command not found on Vercel

The deploy succeeded in linking to the right project (`medibook-gilt`) and the first production URL showed up correctly, but the build itself failed because `vite build` couldn't be found.

## Root cause

Error code `127` means the shell can't find the `vite` binary. This happens because Vercel's build environment doesn't see Vite in `PATH`. The fix is to use `npm run build` as the build command instead of relying on Vercel auto-detecting it.

Two potential causes:

1. **`package-lock.json` was changed but not committed**, so `npm ci` fails and node_modules don't get installed.
2. **Vercel's auto-detected build command** (`vite build`) needs to be overridden to `npm run build` explicitly.

## Fix — add a `build` and `install` command to vercel.json

Open `Doctor-Appointment-Client/vercel.json` and change it to:

```json
{
  "name": "medibook",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}
```

Then retry:
```bash
npx vercel --prod --yes
```

If it still fails, also check if `package-lock.json` exists and is up to date (it was modified when `@google-cloud/storage` was added). Run `npm install` in `Doctor-Appointment-Client/` to regenerate it before deploying:

```bash
cd Doctor-Appointment-Client
npm install
npx vercel --prod --yes
```