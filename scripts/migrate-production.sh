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

# Run Prisma migration
echo "🔄 Running database migration..."
npx dotenv -e .env.production -- npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully"
    echo ""
    echo "🚀 Your production database is ready!"
    echo "You can now test the full feature implementation cycle."
else
    echo "❌ Database migration failed"
    echo "Check your DATABASE_URL and ensure the database is accessible"
    exit 1
fi

# Optional: Generate Prisma client
echo "📦 Generating Prisma client..."
npx dotenv -e .env.production -- npx prisma generate

echo ""
echo "🎉 Production setup complete!"
echo "Visit your Vercel URL to test The Board live."