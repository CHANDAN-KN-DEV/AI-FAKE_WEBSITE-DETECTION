#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Vercel Frontend Deployment for Clarifact..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "📦 Vercel CLI not found. Installing globally..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is already installed."
fi

# Log in (will prompt if not authenticated)
echo "🔑 Ensuring you are logged into Vercel..."
vercel login

# Link the project (prompts for setup on first run)
echo "🔗 Linking local directory to Vercel project..."
vercel link

# Pull environment variables for local testing (optional but recommended)
echo "⬇️ Pulling environment variables..."
vercel env pull .env.local

# Deploy to Production
echo "⚡ Deploying to production..."
vercel --prod

echo "🎉 Vercel Deployment Complete!"