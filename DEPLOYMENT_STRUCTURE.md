# Deployment Structure Guide

This document explains the repository structure required for proper deployment on Railway, Render, and similar PaaS platforms.

## Root-Level Requirements (Critical for Deployment)

### Required Files at Project Root:
```
/
├── Procfile                 # Deployment command (Railway reads this)
├── requirements.txt         # Python dependencies (Railway installs from here)
├── runtime.txt             # Python version specification (optional but recommended)
└── .gitignore              # Security - prevents committing credentials
```

### Why This Structure?

PaaS platforms like Railway, Render, and Heroku have a standard deployment process:

1. **Detect Repository Type** - Looks for language indicators (`requirements.txt` → Python)
2. **Install Dependencies** - Reads from root `/requirements.txt` (NOT from subdirectories)
3. **Build** - Creates slug/container with installed dependencies
4. **Execute** - Runs command from `/Procfile` (NOT from subdirectories)

### Current Structure:
```
✅ /Procfile                         # Found at root (correct)
❌ /backend/requirements.txt          # IGNORED - platform looks at root!
❌ No /runtime.txt                   # Platform defaults to oldest Python
✅ /.gitignore                        # Present (correct)
```

## Files Explained

### `/Procfile`
```
web: PYTHONPATH=backend gunicorn -w 2 -b 0.0.0.0:$PORT wsgi:app
```
- **web:** - declares the web dyno type
- **PYTHONPATH=backend** - tells Python to look for modules in `backend/` directory
- **gunicorn** - WSGI server that starts the Flask app
- **wsgi:app** - imports `backend/wsgi.py` and uses the `app` object

### `/requirements.txt`
- **Must be at root** - Railway searches for this at project root during build phase
- Contains all Python packages needed
- Mirrors `backend/requirements.txt` for synchronization

### `/runtime.txt`
- Specifies exact Python version (e.g., `python-3.11.9`)
- Ensures consistent Python version across environments
- If omitted, platform uses old default version

## Subdirectory Structure

```
/backend/                          # Flask application code
├── app/
│   ├── __init__.py               # Flask app factory
│   ├── config.py                 # Configuration classes
│   ├── models/                   # SQLAlchemy ORM models
│   ├── routes/                   # API route blueprints
│   └── services/                 # Business logic
├── wsgi.py                       # WSGI entry point (Gunicorn loads this)
├── requirements.txt              # BACKUP COPY (sync with root)
└── Procfile                      # BACKUP COPY (root is used)

/frontend/                         # React/Vite application
├── src/
│   ├── App.jsx
│   ├── services/api.js           # Uses VITE_API_URL env var
│   └── ...
├── package.json
└── ...

/certs/                           # SSL certificates (not deployed)
```

## Deployment Flow

```
User Push to GitHub
        ↓
Railway Webhook Triggered
        ↓
Railway Detects Python (finds /requirements.txt at root)
        ↓
Railway Installs Dependencies (from root /requirements.txt)
        ↓
Railway Reads /Procfile (from root)
        ↓
Railway Starts Process: PYTHONPATH=backend gunicorn -w 2 -b 0.0.0.0:$PORT wsgi:app
        ↓
Gunicorn Sets PYTHONPATH=backend (Python can now find /backend/wsgi.py)
        ↓
Gunicorn Imports wsgi:app (loads Flask application)
        ↓
Flask App Factory Runs (/backend/app/__init__.py)
        ↓
All Routes Registered & Database Connected
        ↓
✅ Service Running Successfully
```

## Why Previous Attempts Failed

### Render & First Railway Attempts:
- ❌ Requirements installed from `backend/requirements.txt` (not found)
- ❌ Procfile not read properly
- ❌ Dependencies missing at runtime
- ❌ ModuleNotFoundError: No module named 'wsgi'

### Root Cause:
PaaS platforms have a **fixed discovery pattern** - they look at the project root, not subdirectories. Moving configuration files to subdirectories breaks the automated detection.

## Synchronization Rules

When updating `/backend/requirements.txt`:
1. Update the file in `/backend/`
2. **Also update `/requirements.txt` at root**
3. Commit both changes together

When updating version specifications:
1. Update `/runtime.txt` at root
2. Commit and push to trigger redeploy

## Environment Variables

Railway needs these 6 variables (set in Railway Dashboard):

| Variable | Value | Example |
|----------|-------|---------|
| FLASK_ENV | production | `production` |
| FLASK_DEBUG | false | `false` |
| FLASK_SECRET_KEY | 64-char hex | `openssl rand -hex 32` |
| DATABASE_URL | PostgreSQL URL | `postgresql+psycopg://user:pass@host/db` |
| CORS_ORIGINS | Frontend URL | `https://caresynvision.netlify.app` |
| LOG_LEVEL | Log level | `INFO` |

## Testing Locally

Before pushing to Railway, test the deployment locally:

```bash
# Install dependencies from root requirements.txt
pip install -r requirements.txt

# Test Gunicorn with PYTHONPATH
PYTHONPATH=backend gunicorn -w 2 -b 0.0.0.0:8000 wsgi:app

# Should start successfully without ModuleNotFoundError
```

## Checklist Before Deployment

- [ ] `/Procfile` exists at project root
- [ ] `/requirements.txt` exists at project root (not just in `/backend/`)
- [ ] `/runtime.txt` specifies Python version
- [ ] `.gitignore` prevents committing `.env` files
- [ ] `PYTHONPATH=backend` is in Procfile
- [ ] `/backend/wsgi.py` exists with Flask app factory
- [ ] `/backend/app/__init__.py` creates Flask app
- [ ] All 6 environment variables set in Railway Dashboard
- [ ] Git push succeeds
- [ ] Railway shows "Published" status in deployments

## Summary

**The key fix:** Move critical deployment configuration files to the **project root** where PaaS platforms expect them. This is industry standard and solves 95% of deployment issues.
