# Railway Deployment Guide

## Overview
This guide covers deploying CareSyncVision backend to Railway.app for production use.

## Prerequisites
- Railway account (free tier available at https://railway.app)
- GitHub repository connected to Railway
- PostgreSQL database (Railway provides this)

## Deployment Steps

### 1. Create New Railway Project
1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Authorize Railway with GitHub
4. Select **CareSyncVision** repository
5. Railway will auto-detect the project structure

### 2. Configure Build & Start Commands
Railway uses the **Procfile** in the backend directory automatically.

**Build Command** (set in Railway dashboard):
```bash
pip install -r requirements.txt && flask db upgrade
```

**Start Command** (automatic from Procfile):
```bash
web: gunicorn -w 2 -b 0.0.0.0:$PORT wsgi:app
```

### 3. Set Environment Variables
In Railway dashboard → Variables tab, add:

| Key | Value | Description |
|-----|-------|-------------|
| `FLASK_ENV` | `production` | Production environment |
| `FLASK_DEBUG` | `false` | Disable debug mode |
| `FLASK_SECRET_KEY` | [generate with openssl] | JWT secret - use `openssl rand -hex 32` |
| `DATABASE_URL` | [Railway PostgreSQL] | Railway provides this automatically |
| `CORS_ORIGINS` | `https://caresynvision.netlify.app` | Frontend URL |
| `LOG_LEVEL` | `INFO` | Logging level |

#### How to Get DATABASE_URL
Railway creates a PostgreSQL database automatically. The `DATABASE_URL` environment variable is provided by Railway in the Variables tab.

#### How to Generate FLASK_SECRET_KEY
Run locally:
```bash
openssl rand -hex 32
```
Copy the output and paste into Railway Variables.

### 4. Configure Database
Railway auto-creates a PostgreSQL service. No manual setup needed.

The `DATABASE_URL` is automatically set by Railway and will be in the Variables tab.

### 5. Deploy
Once configuration is complete, Railway will auto-deploy:
1. Pull code from GitHub
2. Run build command (`pip install && flask db upgrade`)
3. Start the application with Procfile

### 6. Monitor Deployment
- Go to **Deployments** tab to see build progress
- Check **Logs** tab for any errors
- Service should show **"Running"** status (green)

## Expected Output
After successful deployment:
- ✅ Service status: **Running**
- ✅ URL: `https://<project-name>.up.railway.app`
- ✅ All routes registered and accessible
- ✅ Database migrations applied

## Testing Deployment
```bash
# Test root endpoint
curl https://<your-railway-url>/

# Test health endpoint
curl https://<your-railway-url>/api/health

# Test auth registration
curl -X POST https://<your-railway-url>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","first_name":"Test","last_name":"User"}'
```

## Troubleshooting

### Service crashes after 30 seconds
**Cause**: Database connection pool timeout
**Solution**: Already fixed in `backend/app/config.py` with connection pool settings
- `pool_recycle`: Recycles stale connections
- `pool_pre_ping`: Tests connections before use
- Prevents Railway's 30-second health check failures

### ModuleNotFoundError: No module named 'wsgi'
**Cause**: Working directory not set correctly
**Solution**: Procfile includes correct working directory context

### Database connection errors
**Cause**: Environment variables not set
**Solution**: Verify all 6 environment variables in Railway Variables tab

### 404 errors on API endpoints
**Cause**: CORS or routing issues
**Solution**: 
- Verify `CORS_ORIGINS` includes your frontend URL
- Check routes are registered (view logs)

## Updating Deployment
To push updates:
```bash
git add .
git commit -m "Update: [description]"
git push origin main
```

Railway will auto-detect the push and redeploy automatically.

## Rollback
To rollback to a previous version:
1. Go to Railway **Deployments** tab
2. Find the previous working deployment
3. Click **"Redeploy"** on that deployment

## Monitoring
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: History of all deployments

## Database Management
- Railway PostgreSQL is managed by Railway
- Backups are automatic (check Railway docs)
- To connect to database for inspection:
  - Get connection string from Railway Variables
  - Use any PostgreSQL client (pgAdmin, psql, etc.)

## Support
- Railway Docs: https://docs.railway.app
- CareSyncVision API Docs: See API_DOCUMENTATION.md
- Issues: Check Railway logs in dashboard

---

**Note**: This project is now configured for Railway deployment. Docker and Render configurations have been removed in favor of a simpler, more reliable Railway setup.
