# The Board - Deployment Guide

## Real-Time Auto-Deployment Setup

The Board is configured for automatic deployment to create a truly self-modifying application where feature implementations are deployed in real-time.

## Deployment Flow

1. **User votes** on features (5 votes triggers auto-implementation)
2. **Claude Code** implements the feature via GitHub Actions
3. **Changes are pushed** to the main branch
4. **Vercel automatically deploys** the updated application
5. **Users see changes** live on the website within 1-2 minutes

## Setup Instructions

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link the project
vercel link

# Deploy
vercel --prod
```

### 2. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:pass@host:port/db
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
ANTHROPIC_API_KEY=sk-ant-your-key
GITHUB_TOKEN=ghp_your-token
GITHUB_REPOSITORY=username/repository-name
```

### 3. Set GitHub Secrets

In GitHub Repository → Settings → Secrets and variables → Actions:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id  
VERCEL_PROJECT_ID=your-project-id
DATABASE_URL=your-postgres-url
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

### 4. Database Setup

#### Option A: Vercel Postgres
1. Go to Vercel Dashboard → Storage → Create Database
2. Select PostgreSQL
3. Copy connection string to environment variables

#### Option B: External PostgreSQL (Neon, Supabase, etc.)
1. Create PostgreSQL database
2. Run migrations: `npx prisma migrate deploy`
3. Add connection string to environment variables

## Auto-Deployment Features

- **Instant Triggers**: Every push to main automatically deploys
- **Fast Builds**: Next.js builds in ~30-60 seconds
- **Zero Downtime**: Vercel provides seamless deployments
- **Preview Deployments**: PRs get preview URLs for testing
- **Rollback Support**: Easy rollback if deployments fail

## Monitoring

- **Vercel Dashboard**: Monitor deployment status and performance
- **GitHub Actions**: Track implementation and deployment workflows  
- **Application Logs**: View real-time logs in Vercel
- **Error Tracking**: Built-in error monitoring

## Testing the Full Flow

1. Create a feature request on the live site
2. Vote it up to 5 votes (or use Test Implementation button)  
3. Watch GitHub Actions implement the feature
4. See the changes deploy automatically
5. View the updated feature live on the site

This creates a complete self-modifying application cycle! 🚀

## Troubleshooting

- **Build Failures**: Check environment variables and dependencies
- **Database Issues**: Verify connection string and migrations
- **GitHub Actions**: Ensure all secrets are properly configured
- **Deployment Errors**: Check Vercel logs for specific error messages