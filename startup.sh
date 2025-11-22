#!/bin/bash

# Azure App Service startup script for FastAPI
echo "Starting GostCAM API..."

# Install dependencies
echo "Installing dependencies..."
pip install --no-cache-dir -r requirements.txt

# Start the application
echo "Starting application with gunicorn..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind=0.0.0.0:8000 --timeout 120