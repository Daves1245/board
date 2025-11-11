#!/bin/bash

echo "🗄️  Migrating Production Database - Adding Feature Status"
echo "========================================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "📥 Pulling environment variables from Vercel..."
    vercel env pull .env.production

    if [ $? -ne 0 ]; then
        echo "❌ Failed to pull environment variables"
        exit 1
    fi
fi

# Load environment variables
echo "📦 Loading production DATABASE_URL..."
export $(grep "^DATABASE_URL=" .env.production | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found"
    exit 1
fi

echo "✅ Connected to: ${DATABASE_URL:0:50}..."
echo ""

echo "This migration will:"
echo "1. Add 'status' column with default 'pending'"
echo "2. Add 'implementationStartedAt' column"
echo "3. Update existing implemented features to status='implemented'"
echo "4. Create index on status column"
echo ""

read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "🔄 Running migration..."

# Run the migration using Prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    exit 1
fi

echo ""
echo "📊 Updating existing implemented features..."

# Update existing features that have implementedAt set to status='implemented'
npx prisma db execute --schema=./prisma/schema.prisma --stdin <<'EOF'
UPDATE "Feature"
SET status = 'implemented'
WHERE "implementedAt" IS NOT NULL;
EOF

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Could not update existing features"
    echo "You may need to run this manually:"
    echo "UPDATE \"Feature\" SET status = 'implemented' WHERE \"implementedAt\" IS NOT NULL;"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "Verification:"
echo "Run this to check the status distribution:"
echo "SELECT status, COUNT(*) FROM \"Feature\" GROUP BY status;"
