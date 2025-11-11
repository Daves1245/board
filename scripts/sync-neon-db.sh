#!/bin/bash

echo "🗄️  Pushing Local Schema to Neon Database"
echo "=========================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "📥 Pulling environment variables from Vercel..."
    vercel env pull .env.production

    if [ $? -ne 0 ]; then
        echo "❌ Failed to pull environment variables"
        echo ""
        echo "Make sure you:"
        echo "1. Are logged in: vercel login"
        echo "2. Have linked this project: vercel link"
        exit 1
    fi
    echo "✅ Environment variables pulled"
    echo ""
fi

# Load environment variables
echo "📦 Loading production DATABASE_URL..."
export $(grep "^DATABASE_URL=" .env.production | xargs)

# Verify DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.production"
    echo ""
    echo "Set it in Vercel: Settings > Environment Variables"
    echo "Get connection string from: https://console.neon.tech"
    exit 1
fi

echo "✅ Connected to: ${DATABASE_URL:0:50}..."
echo ""

# Test connection
echo "🔌 Testing database connection..."
npx prisma db execute --url "$DATABASE_URL" --stdin > /dev/null 2>&1 <<EOF
SELECT 1;
EOF

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to Neon database"
    echo ""
    echo "Check your Neon database at: https://console.neon.tech"
    exit 1
fi

echo "✅ Connection successful"
echo ""

echo "Choose sync method:"
echo ""
echo "1. 🔄 Apply migrations (recommended - safe, preserves data)"
echo "   Uses: prisma migrate deploy"
echo ""
echo "2. 📤 Push schema directly (quick - for empty database)"
echo "   Uses: prisma db push"
echo ""
echo "3. 🗑️  Reset and migrate (WARNING: deletes all data)"
echo "   Uses: prisma migrate reset"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔄 Applying migrations to Neon database..."
        echo "This will create all tables based on your local schema"
        echo ""

        npx prisma migrate deploy --schema=./prisma/schema.prisma

        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Migrations applied successfully!"
        else
            echo ""
            echo "❌ Migration failed"
            echo ""
            echo "If this is a fresh database, try option 2 (push schema)"
            exit 1
        fi
        ;;
    2)
        echo ""
        echo "📤 Pushing schema to Neon database..."
        echo "This will create/update tables to match your local schema"
        echo ""

        npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss

        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Schema pushed successfully!"
        else
            echo ""
            echo "❌ Push failed"
            exit 1
        fi
        ;;
    3)
        echo ""
        echo "⚠️  WARNING: This will DELETE ALL DATA in your Neon database!"
        read -p "Type 'RESET DATABASE' to confirm: " confirm

        if [ "$confirm" = "RESET DATABASE" ]; then
            echo ""
            echo "🗑️  Resetting Neon database..."

            npx prisma migrate reset --schema=./prisma/schema.prisma --force

            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ Database reset and schema applied!"
            else
                echo ""
                echo "❌ Reset failed"
                exit 1
            fi
        else
            echo "❌ Reset cancelled"
            exit 1
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📦 Generating Prisma client..."
npx prisma generate

echo ""
echo "=========================================="
echo "🎉 Neon database synced!"
echo ""
echo "Verify in Neon Console:"
echo "https://console.neon.tech > Your Project > Tables"
echo ""
echo "Expected tables:"
echo "- Account"
echo "- Session"
echo "- User"
echo "- Feature"
echo "- Vote"
echo "- VerificationToken"
echo "- _prisma_migrations"
echo ""
echo "Deploy to Vercel:"
echo "vercel --prod"
