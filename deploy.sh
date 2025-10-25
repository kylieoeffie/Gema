#!/bin/bash

echo "🚀 SameWave Deployment Script"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - SameWave music discovery app"
fi

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No Git remote found!"
    echo "Please add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/samewave.git"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..

echo "🔨 Building frontend..."
npm run build

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy backend to Railway: https://railway.app"
echo "3. Deploy frontend to Vercel: https://vercel.com"
echo ""
echo "See DEPLOYMENT.md for detailed instructions!"