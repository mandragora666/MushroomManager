#!/bin/bash
# Cloudflare Pages Build Script
echo "🔨 Building Mushroom Manager for Cloudflare Pages..."
echo "📦 Installing dependencies..."
npm ci

echo "🏗️ Building application..."
npm run build

echo "📂 Checking build output..."
ls -la dist/

echo "✅ Build complete! Ready for deployment."