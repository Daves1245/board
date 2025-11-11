#!/bin/bash

echo "🗄️ Running Production Database Migration"
echo "======================================"

# Pull environment variables from Vercel
echo "📥 Pulling environment variables from Vercel..."
vercel env pull .env.production

if [ ! -f ".env.production" ]; then
    echo "❌ Failed to pull environment variables"
    echo "Make sure you're logged into Vercel and have configured the environment variables"
    exit 1
fi

echo "✅ Environment variables pulled successfully"

# Set environment variables from production file
echo "📦 Loading production environment variables..."
export $(grep -v '^#' .env.production | xargs)

# Verify DATABASE_URL is loaded
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment"
    echo "Check your .env.production file"
    exit 1
fi

echo "✅ DATABASE_URL loaded: ${DATABASE_URL:0:50}..."

# Run Prisma migration
echo "🔄 Running database migration..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully"
    echo ""
    echo "🚀 Your production database is ready!"
    echo "You can now test the full feature implementation cycle."
else
    echo "❌ Database migration failed"
    echo "Check your DATABASE_URL and ensure the database is accessible"
    echo "Full DATABASE_URL: $DATABASE_URL"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

echo ""
echo "🎉 Production setup complete!"
echo "Visit your Vercel URL to test The Board live."