# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

Write-Host "Starting Railway Backend Deployment for Clarifact..." -ForegroundColor Cyan

# Check if Railway CLI is installed
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Railway CLI not found. Installing globally via npm..." -ForegroundColor Yellow
    npm install -g @railway/cli
} else {
    Write-Host "Railway CLI is already installed." -ForegroundColor Green
}

# Authenticate
Write-Host "Logging into Railway..." -ForegroundColor Cyan
railway login

# Link Project
Write-Host "Linking to your Railway project..." -ForegroundColor Cyan
railway link

# Deploy
Write-Host "Pushing code to Railway..." -ForegroundColor Cyan
railway up

Write-Host "Railway Deployment Complete!" -ForegroundColor Green