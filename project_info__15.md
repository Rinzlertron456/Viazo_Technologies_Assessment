# Two clear issues found. Here's the root cause and fix for both.

## Issue 1: SPA 404 on refresh

**Root cause**: When you refresh `/login` or `/patient/search`, Vercel tries to find a file at that path. Since there's no file — it's a client-side route — Vercel returns 404. This is the classic SPA deployment problem.

**Fix**: Add a `rewrites` rule to `vercel.json` so all routes fall back to `index.html`.

## Issue 2: Upload shows "failed" even when it succeeds

**Root cause**: There are TWO problems in the upload flow:

1. **The `api.post` retry logic breaks FormData uploads**. When the auth token expires (401), `api.ts` tries to retry the request. But FormData bodies can get consumed in the retry attempt, causing the second attempt to fail with an empty body. The retry throws an error, which triggers the catch block → "Upload failed" — even though the **first attempt might have already hit the server** (and the file was actually stored on GCS).

2. **No loading/uploading state**. The user clicks upload and nothing visible happens for a moment, so they don't know if it's working.

**Fix**: Use direct `fetch` for file uploads instead of `api.post`, with a proper loading state and a 30-second timeout. This avoids the retry logic entirely and gives clear status feedback.

## Let me implement both fixes

I'll need to:
1. Update `vercel.json` with a `rewrites` rule for SPA routing
2. Rewrite the upload handler in `BookAppointment.tsx` with a direct fetch, loading state, and timeout

Toggle to **Act Mode** and I'll implement both.