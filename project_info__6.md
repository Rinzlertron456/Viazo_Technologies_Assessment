# Permission Issue — Here's What's Happening

The Cloud Build API was enabled ✅, but your account `sainath2k20@gmail.com` lacks the IAM role needed to submit builds. Two things to check:

## Check 1: Is `sainath2k20@gmail.com` the correct account for this project?

The project ID is `appointment-booking-app-501907` but the project NUMBER is `1047653169613`. Your current `gcloud` account is `sainath2k20@gmail.com`. You need to verify this account is an **Owner** or **Editor** on the project.

Run this to check:
```bash
gcloud projects get-iam-policy appointment-booking-app-501907 \
  --flatten="bindings[].members" \
  --filter="bindings.members:sainath2k20@gmail.com" \
  --format="table(bindings.role)"
```

## Check 2: You may be using the wrong Google account

You might be logged into `gcloud` with a different account than the one that owns the project.

Run this to see all accounts and switch:
```bash
gcloud auth list
```

If `sainath2k20@gmail.com` isn't the right one, or you want to add it:

### Fix Option A — Add Cloud Build permissions to your account (fastest)

```bash
gcloud projects add-iam-policy-binding appointment-booking-app-501907 \
  --member="user:sainath2k20@gmail.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding appointment-booking-app-501907 \
  --member="user:sainath2k20@gmail.com" \
  --role="roles/storage.objectAdmin"
```

Then retry:
```bash
bash deploy.sh
```

### Fix Option B — Switch to the project owner account

If the project was created under a **different Google account**:
```bash
gcloud auth login
```

Then retry `bash deploy.sh`.

### Fix Option C — Login via service account key (if you have one)

If the project owner shared a JSON service account key with you:
```bash
gcloud auth activate-service-account --key-file=path/to/key.json
```

---

## The TL;DR

The error is **not a code bug** — it's an IAM permissions issue. Your `gcloud` account (`sainath2k20@gmail.com`) needs the **Cloud Build Editor** role (`roles/cloudbuild.builds.editor`) to run `gcloud builds submit`. Run Option A above, then try again.