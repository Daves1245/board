#!/bin/bash

echo "🔍 Diagnosing Production Database"
echo "=================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production not found. Pulling from Vercel..."
    vercel env pull .env.production

    if [ $? -ne 0 ]; then
        echo "❌ Failed to pull environment variables from Vercel"
        echo ""
        echo "Please ensure:"
        echo "1. You're logged into Vercel CLI (run: vercel login)"
        echo "2. You're in the correct project directory"
        echo "3. Database environment variables are set in Vercel"
        exit 1
    fi
fi

# Load environment variables
echo "📦 Loading environment variables..."
source .env.production

# Verify DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.production"
    echo ""
    echo "Please set DATABASE_URL in Vercel:"
    echo "1. Go to your Vercel project settings"
    echo "2. Navigate to Environment Variables"
    echo "3. Add DATABASE_URL with your Neon database connection string"
    exit 1
fi

echo "✅ DATABASE_URL loaded"
echo "   Connection: ${DATABASE_URL:0:50}..."
echo ""

# Check database connection
echo "🔌 Testing database connection..."
DATABASE_URL="$DATABASE_URL" npx prisma db execute --url $DATABASE_URL --stdin <<EOF
SELECT version();
EOF

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database"
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify your Neon database is active"
    echo "2. Check if the connection string is correct"
    echo "3. Ensure your IP is allowed (Neon should allow all by default)"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Check for existing tables
echo "📋 Checking for existing tables..."
DATABASE_URL="$DATABASE_URL" npx prisma db execute --url $DATABASE_URL --stdin <<'EOF'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
EOF

if [ $? -ne 0 ]; then
    echo "⚠️  Could not query tables"
else
    echo ""
fi

# Check migration status
echo "🔄 Checking migration status..."
DATABASE_URL="$DATABASE_URL" npx prisma migrate status

echo ""
echo "=================================="
echo "Diagnosis complete!"
echo ""
echo "Next steps:"
echo "1. If tables are missing, run: ./scripts/sync-neon-db.sh"
echo "2. If migrations are pending, they will be applied by the sync script"
