I investigated every file that could have caused data loss. Here's my analysis:

## Your data is almost certainly still there.

Here's what I found and why nothing I did would delete data:

### 1. Database config is unchanged
`db.ts` — untouched. It just calls `mongoose.connect(env.MONGODB_URI)`. No `dropDatabase()`, no `syncIndexes()`, no `deleteMany()`, nothing destructive.

`.env` — unchanged. It still points to `mongodb://localhost:27017/doctor-appointment` — your original database name.

### 2. The server was never started
`server.ts` is untouched. More importantly, **I never ran `node server.ts` or `npm start` or any command that would connect to MongoDB**. Without a running server, no code that touches the database executes.

### 3. Model changes were additive only (safe)
The only model change was to `User.ts` — I added 4 optional fields:
```typescript
verificationToken: { type: String, select: false },    // NEW
verificationExpires: { type: Date, select: false },      // NEW
twoFactorSecret: { type: String, select: false },        // NEW
twoFactorEnabled: { type: Boolean, default: false },     // NEW
```

MongoDB doesn't care about schema changes — new fields simply don't exist on old documents. `select: false` only affects queries that explicitly use `.select()` — it doesn't delete data.

### 4. No delete operations in any controller
I searched every controller file I created/modified for `deleteMany`, `deleteOne`, `drop`, `remove`, `findByIdAndDelete`, `findOneAndDelete`:

| Controller | Destructive ops found |
|---|---|
| `auth.controller.ts` | Only `findByIdAndUpdate` with `$pull` on refreshTokens (safe) |
| `admin.controller.ts` | Only `findByIdAndUpdate` (safe) |
| `patient.controller.ts` | Only `findByIdAndUpdate` with status changes (safe) |
| `doctor.controller.ts` | None |
| `receptionist.controller.ts` | None |
| `payment.controller.ts` | Only `findOneAndUpdate` (safe) |
| `review.controller.ts` | None |
| `license.controller.ts` | Only `findOneAndUpdate` (safe) |
| `pharmacy.controller.ts` | Has `findByIdAndDelete` — **but only for the Pharmacy collection, not User/Appointment** |

### What likely happened (most probable cause)

**Since the server wasn't running during our session**, the data loss happened outside it. The most likely reasons, ordered by probability:

1. **You restarted MongoDB** — If MongoDB is running locally and was stopped/restarted with a different `--dbpath`, you'd get a fresh empty database. Your `.env` points to `localhost:27017` which is the default MongoDB port — if MongoDB was reinstalled or the data directory was cleared, the database would be empty.

2. **Different environment/config** — If you ran the server with a different `.env` or environment variable that changed `MONGODB_URI`, it would connect to a different database.

3. **A seed script or test run** — If you ran any npm script like `npm run seed`, `npm run reset`, or any test that drops collections before seeding.

4. **Something outside this project** — MongoDB Compass, a different Node.js process, or a cron job could have dropped the database.

**To verify your data still exists**, run this in your terminal:
```bash
cd Doctor-Appointment-Server
npx mongosh "mongodb://localhost:27017/doctor-appointment" --eval "db.getCollectionNames()"
```

If that returns collection names like `users`, `appointments`, etc., your data is fine and the issue is in your app config. If it returns nothing or fails to connect, your local MongoDB either isn't running or the data directory was cleared.