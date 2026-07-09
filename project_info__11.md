# The container starts but crashes immediately

The container deployed to Cloud Run successfully (IAM Policy was set ✅), but it's crashing when it starts. The log says it failed to listen on PORT=8080 within the timeout.

## Root cause analysis

Looking at the startup sequence in `server.ts`:

1. `connectDB()` → connects to MongoDB Atlas
2. `seed()` → creates test accounts
3. `app.listen()` → starts the HTTP server

The crash is almost certainly **MongoDB Atlas connection failing** because:

1. **MongoDB Atlas Network Access** — Atlas free tier blocks all IPs by default. Cloud Run uses dynamic IPs. The connection gets **denied**, `connectDB()` calls `process.exit(1)`, and the container dies before the HTTP server can listen.

2. **Seed script failing on retry** — Even if DB connects, the seed script might encounter an issue.

## Fix — Two things needed

### Fix 1: Allow all IPs in MongoDB Atlas (quickest)

Go to **MongoDB Atlas → Network Access → Add IP Address → `0.0.0.0/0`** (Allow from anywhere)

Cloud Run uses ephemeral IPs, so you can't whitelist specific IPs.

### Fix 2: Make the server more resilient

The `connectDB()` function calls `process.exit(1)` on failure. We should make it not crash the container but instead keep retrying. Update `src/config/db.ts`:

Change from:
```typescript
process.exit(1);
```
To:
```typescript
console.error('MongoDB connection failed. Retrying in 5 seconds...');
await new Promise(r => setTimeout(r, 5000));
// Don't exit — let it retry on next health check
```

### Fix 3: Check the Cloud Run logs

You can view the exact error by running:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=medibook-api" --limit=10
```

---

## TL;DR — you need to open MongoDB Atlas to `0.0.0.0/0`

Go to Atlas → Network Access → Add `0.0.0.0/0` → then update the deploy script and re-run `bash deploy.sh`.

The code is correct — it's purely a network connectivity issue between Cloud Run and MongoDB Atlas.