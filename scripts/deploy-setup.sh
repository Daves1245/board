#!/bin/bash

echo "🚀 The Board - Production Deployment Setup"
echo "========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "📝 Step 1: Deploy to Vercel"
echo "Run: vercel --prod"
echo ""

echo "🗄️ Step 2: Set up Postgres Database"
echo "1. Go to Vercel Dashboard → Storage → Create Database → PostgreSQL"
echo "2. Copy the DATABASE_URL connection string"
echo ""

echo "⚙️ Step 3: Configure Environment Variables"
echo "Add these in Vercel Dashboard → Settings → Environment Variables:"
echo ""
echo "DATABASE_URL=postgresql://[from-step-2]"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "NEXTAUTH_URL=https://your-app.vercel.app"
echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
echo "GITHUB_TOKEN=$GITHUB_TOKEN"
echo "GITHUB_REPOSITORY=Daves1245/board"
echo ""

echo "🔐 Step 4: Set GitHub Secrets"
echo "Add these in GitHub → Settings → Secrets → Actions:"
echo "- VERCEL_TOKEN (from Vercel Account Settings)"
echo "- VERCEL_ORG_ID (from Vercel Project Settings)"  
echo "- VERCEL_PROJECT_ID (from Vercel Project Settings)"
echo "- DATABASE_URL (same as above)"
echo "- NEXTAUTH_SECRET (same as above)"
echo "- NEXTAUTH_URL (same as above)"
echo ""

echo "🔄 Step 5: Run Database Migration"
echo "After environment variables are set:"
echo "vercel env pull .env.production"
echo "npx dotenv -e .env.production -- npx prisma migrate deploy"
echo ""

echo "🧪 Step 6: Test Full Cycle"
echo "1. Visit your live site"
echo "2. Create a feature request"
echo "3. Vote it to 5 votes or use Test Implementation"
echo "4. Watch Claude Code implement it"
echo "5. See it deploy automatically!"
echo ""
echo "✅ Ready to go live!"