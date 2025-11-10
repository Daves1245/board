# Claude Code Standards for The Board

## Project Overview
This is "The Board" - a self-modifying feature voting platform built with Next.js 14+, TypeScript, Tailwind CSS, Prisma ORM, and NextAuth.js authentication.

## Architecture
- **Frontend**: Next.js 14+ App Router with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Real-time**: WebSocket server for live updates
- **Deployment**: Vercel-compatible

## Code Standards

### TypeScript
- Use strict TypeScript with proper type definitions
- Define interfaces in `app/types/index.ts`
- Avoid `any` types - use proper type assertions
- Use generic types where appropriate

### React Components
- Use functional components with hooks
- Follow existing component patterns in `app/components/`
- Use proper prop typing with TypeScript interfaces
- Implement loading states and error handling
- Use consistent naming: PascalCase for components

### Styling
- Use Tailwind CSS exclusively for styling
- Follow existing design patterns and color schemes
- Implement responsive design with mobile-first approach
- Use dark mode classes when appropriate (`dark:`)
- Keep consistent spacing and typography scale

### API Routes
- Follow Next.js 14+ App Router API patterns
- Use proper HTTP status codes and error handling
- Implement authentication checks where needed
- Use Prisma for database operations
- Return consistent JSON response structures

### Database
- Use Prisma ORM for all database operations
- Follow existing schema patterns in `prisma/schema.prisma`
- Use proper foreign key relationships
- Implement proper error handling for database operations

### File Organization
```
app/
├── components/          # Reusable React components
├── api/                # API routes
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── (auth)/             # Authentication pages
```

## Implementation Guidelines

### New Features
1. Analyze existing codebase patterns before implementing
2. Follow the established component and API structure
3. Ensure TypeScript compatibility
4. Test functionality before committing
5. Maintain backward compatibility

### Code Quality
- Write clean, readable code with proper comments
- Use meaningful variable and function names
- Implement proper error handling
- Follow security best practices (no secrets in code)
- Use existing utility functions when possible

### Git Practices
- Create descriptive commit messages
- Use feature branches for new implementations
- Include feature ID in commit messages when auto-implementing
- Ensure code builds successfully before committing

## Key Features to Maintain
- Real-time voting system
- Feature auto-implementation at 5 votes
- User authentication and authorization
- Responsive design
- Rate limiting for API endpoints
- WebSocket integration for live updates

## Testing
- Ensure `npm run build` passes
- Test authentication flows
- Verify database operations work correctly
- Check responsive design on multiple screen sizes

When implementing features, always consider the existing codebase structure and maintain consistency with established patterns.