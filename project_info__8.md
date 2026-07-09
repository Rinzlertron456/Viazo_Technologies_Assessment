# Root Cause: Shell mismatch

You ran `gcloud auth login` in **PowerShell** (your default terminal), but `bash deploy.sh` runs inside **Git Bash or WSL bash**, which has its own separate `gcloud` config directory. They don't share credentials.

## Fix — Two options:

### Option A (easiest — 10 seconds): Set the account in deploy.sh

Just add this line right after the project config:
```bash
gcloud config set account sainath2k20@gmail.com
```

### Option B (recommended): Run gcloud auth login INSIDE the same bash shell

```bash
bash
gcloud auth login
bash deploy.sh
```

This ensures both commands use the same gcloud config.

---

## What the error means

- `gcloud auth login` → saves credentials to **Windows** gcloud config
- `bash deploy.sh` → runs **Git Bash gcloud**, which looks in a **different** config directory
- Git Bash gcloud has no active account → error

The script already sets the project. Adding `gcloud config set account sainath2k20@gmail.com` will fix it, but Option B (running auth from the same shell) is the cleanest long-term solution.