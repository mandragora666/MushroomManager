#!/bin/bash
# 🚀 Mushroom Manager - Auto Deploy Script
# Synchronisiert lokale Änderungen → GitHub → Cloudflare Pages

set -e  # Exit on any error

echo "🍄 MUSHROOM MANAGER AUTO-DEPLOY"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Not in project directory!"
    echo "🔧 Run: cd /home/user/webapp && ./AUTO_DEPLOY_SCRIPT.sh"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected, adding to git..."
    git add .
    
    # Get commit message from user or use default
    if [ -z "$1" ]; then
        COMMIT_MSG="🔄 Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    else
        COMMIT_MSG="$1"
    fi
    
    echo "💾 Committing: $COMMIT_MSG"
    git commit -m "$COMMIT_MSG"
else
    echo "✅ No local changes to commit"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

# Build locally to test
echo "🏗️ Building project locally..."
npm run build

# Wait a moment for GitHub webhook
echo "⏱️ Waiting for Cloudflare Pages to detect changes (30s)..."
sleep 30

# Test the deployment
echo "🧪 Testing deployment..."
MAIN_URL="https://mushroom-manager.pages.dev"
PREVIEW_URL="https://4ce79d79.mushroommanager.pages.dev"

echo "📊 Checking main deployment: $MAIN_URL"
if curl -s -o /dev/null -w "%{http_code}" "$MAIN_URL" | grep -q "200"; then
    echo "✅ Main deployment: ONLINE"
else
    echo "❌ Main deployment: OFFLINE or ERROR"
fi

echo "📊 Checking preview deployment: $PREVIEW_URL"  
if curl -s -o /dev/null -w "%{http_code}" "$PREVIEW_URL" | grep -q "200"; then
    echo "✅ Preview deployment: ONLINE"
else
    echo "❌ Preview deployment: OFFLINE or ERROR"
fi

echo ""
echo "🎉 AUTO-DEPLOY COMPLETE!"
echo "🌐 Main: $MAIN_URL"
echo "🔍 Preview: $PREVIEW_URL"
echo ""
echo "💡 Usage examples:"
echo "  ./AUTO_DEPLOY_SCRIPT.sh"
echo "  ./AUTO_DEPLOY_SCRIPT.sh '🐛 Fixed protocol validation bug'"
echo "  ./AUTO_DEPLOY_SCRIPT.sh '📸 Added photo upload feature'"