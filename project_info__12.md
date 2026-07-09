# Good news — your backend IS running successfully

The logs confirm your Cloud Run API is live at:
```
https://medibook-api-n5wvooyjrq-uc.a.run.app
```

All the `401` responses are **expected** — that's the API correctly rejecting unauthenticated requests (no cookies sent). The 3 errors you see at startup are **rate limiter warnings** that don't crash the app, just noisy logs.

## Two things left to fix:

### 1. Set `VITE_API_URL` on Vercel (this is why login fails)

The browser console showed `POST http://localhost:5000/api/auth/login` — your frontend doesn't know the backend URL. Run:

```bash
cd Doctor-Appointment-Client
npx vercel env add VITE_API_URL production
```

When prompted:
- **Value**: `https://medibook-api-n5wvooyjrq-uc.a.run.app/api`
- **Sensitive?**: `n`

Then redeploy:
```bash
npx vercel --prod --yes
```

### 2. (Optional) Fix the rate limiter warnings

Add this to `Doctor-Appointment-Server/src/app.ts` right after the `helmet` middleware:
```typescript
app.set('trust proxy', true);
```

This prevents the `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` errors in the logs. You'll need to rebuild and redeploy the backend after this change:

```bash
bash deploy.sh
```

---

## Your Vercel answers

When `npx vercel env add VITE_API_URL production` asks:
- **"Value"**: `https://medibook-api-n5wvooyjrq-uc.a.run.app/api`
- **"Sensitive?"**: Type `n` (No — it's just a URL, not a password)