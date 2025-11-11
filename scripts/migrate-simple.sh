#!/bin/bash

echo "🗄️ Simple Production Database Migration"
echo "====================================="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found"
    echo "Run 'vercel env pull .env.production' first"
    exit 1
fi

# Load environment variables manually
echo "📦 Loading environment variables..."
source .env.production

# Verify DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found"
    echo "Check your .env.production file contains DATABASE_URL"
    exit 1
fi

echo "✅ DATABASE_URL loaded: ${DATABASE_URL:0:50}..."

# Run Prisma migration
echo "🔄 Running database migration..."
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    
    # Generate Prisma client
    echo "📦 Generating Prisma client..."
    DATABASE_URL="$DATABASE_URL" npx prisma generate
    
    echo ""
    echo "🎉 Database setup complete!"
    echo "Your production database is ready for The Board."
else
    echo "❌ Migration failed"
    echo "Database URL: $DATABASE_URL"
    echo ""
    echo "Common issues:"
    echo "- Check if database is accessible"
    echo "- Verify DATABASE_URL format"
    echo "- Ensure database exists and credentials are correct"
    exit 1
fi