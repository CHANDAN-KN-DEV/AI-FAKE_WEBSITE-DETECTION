#!/bin/bash

set -e

echo "🚂 Starting Railway Backend Deployment for Clarifact..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
else
    echo "✅ Railway CLI is already installed."
fi

# Authenticate
echo "🔑 Logging into Railway..."
railway login

# Link or Init project
echo "🔗 Linking to your Railway project..."
railway link

# Deploy
echo "☁️ Pushing code to Railway..."
railway up

echo "🎉 Railway Deployment Complete!"