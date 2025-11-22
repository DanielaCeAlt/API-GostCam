# GostCAM API - Azure Deployment Configuration

## Required Environment Variables
DATABASE_URL=mysql+pymysql://username:password@server:port/database?ssl_ca=/path/to/certificate&ssl_disabled=False

## Azure App Service Settings
WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
WEBSITES_PORT=8000
SCM_DO_BUILD_DURING_DEPLOYMENT=true

## Python Version
PYTHON_VERSION=3.13

## Startup Command Options:

### Option 1: Direct uvicorn (recommended for development)
# python -m uvicorn main:app --host 0.0.0.0 --port 8000

### Option 2: Gunicorn with Uvicorn workers (recommended for production)
# gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind=0.0.0.0:8000

### Option 3: Azure App Service auto-detection
# Let Azure detect the startup command automatically

## Troubleshooting
# If you get "No module named 'uvicorn'" error:
# 1. Ensure requirements.txt includes both uvicorn and gunicorn
# 2. Use the startup command that explicitly installs dependencies
# 3. Check Azure App Service logs for detailed error messages

## Build Command for Azure
# pip install --no-cache-dir -r requirements.txt

## Health Check Endpoint
# The API provides a health check at: /health
# Use this for Azure Health Checks