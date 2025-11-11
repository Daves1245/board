# Claude Code Standards for The Board

## Project Overview
This is "The Board" - a self-modifying feature voting platform built with Next.js 14+, TypeScript, Tailwind CSS, Prisma ORM, and NextAuth.js authentication.

**The Core Concept**: Users propose features by creating feature requests. Other users vote on these features. When a feature receives 5 votes, it **automatically triggers an AI agent (Claude Code) via GitHub Actions** to implement the feature and deploy it to production. The Board literally modifies itself based on user votes.

## Architecture
- **Frontend**: Next.js 14+ App Router with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Database**: PostgreSQL with Prisma ORM (Neon for production)
- **Authentication**: NextAuth.js with credentials provider
- **Real-time**: WebSocket server for live updates
- **Auto-Implementation**: GitHub Actions + Claude Code API
- **Deployment**: Vercel (auto-deploys on main branch push)

## Project Structure & Key Files

### Frontend Components (`app/components/`)
- **`FeatureList.tsx`**: Main component that displays all feature requests with voting
- **`FeatureCard.tsx`**: Individual feature card showing title, description, votes, creator
- **`VoteButton.tsx`**: Vote button component (ChevronUp icon + vote count)
- **`CreateFeatureForm.tsx`**: Form for submitting new feature requests
- **`AuthProvider.tsx`**: NextAuth session provider wrapper
- **`ThemeToggle.tsx` / `DarkModeToggle.tsx`**: Theme switching components
- **`board.tsx` / `feature.tsx`**: Additional UI components

### API Routes (`app/api/`)
- **`features/route.ts`**: GET all features (with vote counts and user's voted status)
- **`features/create/route.ts`**: POST to create new feature request
- **`features/[id]/vote/route.ts`**: POST to toggle vote on a feature
  - **CRITICAL**: Contains auto-implementation trigger at 5 votes (line 91)
  - Calls `/api/implement` when threshold reached
- **`features/[id]/implement/route.ts`**: Manual implementation endpoint (fallback)
- **`implement/route.ts`**: Triggers GitHub Action workflow
- **`auth/[...nextauth]/route.ts`**: NextAuth configuration
- **`auth/signup/route.ts`**: User registration endpoint
- **`webhook/github/route.ts`**: GitHub webhook handler

### Database (`prisma/schema.prisma`)
Models:
- **`User`**: username, password (hashed), isStaff, isActive
- **`Feature`**: title, description, creatorId, parentId, createdAt, implementedAt, votes (historical)
- **`Vote`**: userId + featureId (unique constraint - one vote per user per feature)
- **`Session`** / **`Account`** / **`VerificationToken`**: NextAuth tables

### Libraries (`app/lib/`)
- **`auth.ts`**: NextAuth configuration with credentials provider
- **`db.ts`**: Prisma client singleton
- **`rate-limit.ts`**: Rate limiting for votes and API calls
- **`utils.ts`**: Utility functions (e.g., cn for className merging)

### Hooks (`app/hooks/`)
- **`useWebSocket.tsx`**: Real-time updates for votes and feature changes

### Types (`app/types/`)
- **`index.ts`**: TypeScript interfaces for Feature, Vote, User, etc.
- **`next-auth.d.ts`**: NextAuth type extensions

### Pages
- **`app/page.tsx`**: Home page (renders FeatureList)
- **`app/(auth)/login/page.tsx`**: Login page
- **`app/(auth)/signup/page.tsx`**: Registration page
- **`app/layout.tsx`**: Root layout with providers and global styles

### GitHub Workflows (`.github/workflows/`)
- **`implement-feature.yml`**: Auto-implementation workflow
  - Triggered by `/api/implement` when feature reaches 5 votes
  - Uses `anthropics/claude-code-action@v1`
  - Reads CLAUDE.md for implementation guidelines
  - Commits and pushes changes to main branch
  - Vercel auto-deploys the changes
- **`deploy.yml`**: Manual deployment workflow

## How The Auto-Implementation System Works

1. **User votes on a feature** → VoteButton component calls `/api/features/[id]/vote`
2. **Vote is recorded** → Database creates/deletes Vote record
3. **Vote count checked** → If `voteCount >= 5` (line 91 in `vote/route.ts`)
4. **GitHub Action triggered** → POST to `/api/implement` which calls GitHub API
5. **Claude Code runs** → `implement-feature.yml` workflow executes
   - Checks out repository
   - Reads CLAUDE.md for project standards
   - Analyzes feature request
   - Implements the feature
   - Runs `npm run build` to verify
   - Commits changes with feature ID
6. **Auto-deployment** → Vercel detects main branch push and deploys
7. **Feature marked implemented** → `implementedAt` timestamp set, votes archived

**This is the core mechanism of The Board and must NEVER be modified unless explicitly requested.**

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

### Understanding User Intent
**CRITICAL: Before implementing any feature, you must thoroughly understand what the user is asking for.**

1. **Read the Feature Request Carefully**
   - Parse the feature title and description for exact requirements
   - Identify the primary goal and any secondary objectives
   - Look for specific UI/UX requirements, technical constraints, or edge cases mentioned
   - Note if the feature is an enhancement, bug fix, or new functionality

2. **Ask Clarifying Questions When Needed**
   - If the request is ambiguous or lacks critical details, document your assumptions
   - Consider: What problem is this solving? Who is the target user? What should the UX be?
   - Think about edge cases and error states that aren't explicitly mentioned

3. **Plan Before Coding**
   - Identify which files need to be modified
   - Determine if new components, API routes, or database changes are needed
   - Check for dependencies or conflicts with existing features
   - Consider the full user journey from UI interaction to backend processing

4. **Scope Appropriately**
   - Implement exactly what is requested - no more, no less
   - Don't add "nice-to-have" features unless explicitly requested
   - Don't refactor unrelated code unless necessary for the feature
   - Keep changes minimal and focused on the stated goal

### Verifying Changes
**CRITICAL: After implementing any feature, you must verify it works correctly and matches the request.**

1. **Pre-Commit Verification**
   - Run `npm run build` to ensure no TypeScript or build errors
   - Review all modified files to ensure changes are intentional
   - Check that no unrelated code was accidentally modified
   - Verify all imports and dependencies are correct

2. **Functional Verification**
   - Test the happy path: Does the feature work as intended?
   - Test edge cases: What happens with invalid inputs or edge conditions?
   - Test error states: Are errors handled gracefully?
   - Test with authentication: Does it respect user permissions?

3. **Integration Verification**
   - Does the feature integrate properly with existing UI components?
   - Are API routes returning the expected responses?
   - Do database operations complete successfully?
   - Does the real-time WebSocket system update correctly?

4. **Quality Checklist**
   - [ ] Feature matches the request exactly
   - [ ] TypeScript types are correct and complete
   - [ ] No console errors or warnings
   - [ ] Styling is consistent with existing design
   - [ ] Responsive design works on mobile and desktop
   - [ ] Error handling is implemented
   - [ ] Code follows existing patterns and conventions
   - [ ] Build succeeds without errors
   - [ ] No unintended side effects on other features

5. **Documentation in Commit**
   - Write a clear commit message explaining what was implemented
   - Reference the feature ID in the commit message
   - List any important implementation details or decisions made
   - Note if there are any limitations or follow-up work needed

### New Features
1. Analyze existing codebase patterns before implementing
2. Follow the established component and API structure
3. Ensure TypeScript compatibility
4. Test functionality before committing
5. Maintain backward compatibility

## 🚨 CRITICAL: Protected Systems

### NEVER Modify the Voting Mechanism
**The voting and auto-implementation system is the core purpose of The Board and must NEVER be changed unless the feature explicitly requests it.**

Protected files and functionality:
- **`app/api/features/[id]/vote/route.ts`** - Vote toggling and auto-implementation trigger
- **The 5-vote threshold** for auto-implementation (line 91)
- **Vote counting logic** - Database queries for vote totals
- **`app/components/VoteButton.tsx`** - Vote button UI and behavior
- **`Vote` model** in `prisma/schema.prisma` - Database schema for votes
- **`.github/workflows/implement-feature.yml`** - Auto-implementation workflow
- **`app/api/implement/route.ts`** - GitHub Action trigger endpoint

Do NOT change:
- ❌ The 5-vote threshold (unless feature explicitly requests changing the threshold)
- ❌ Vote counting or recording logic
- ❌ The GitHub Action trigger mechanism
- ❌ How votes are stored in the database
- ❌ The one-vote-per-user-per-feature constraint
- ❌ The auto-implementation workflow steps

You MAY change:
- ✅ Vote button styling or positioning (if requested)
- ✅ Adding analytics or logging for votes
- ✅ UI improvements to show vote counts
- ✅ Adding vote history or notifications
- ✅ Improving error handling in the voting flow

**If a feature requests changes to the voting system itself, implement it carefully and ensure the core auto-implementation mechanism still functions correctly.**

### Documentation Updates
When a feature request asks to update documentation:

1. **Determine which documentation to update**:
   - **CLAUDE.md**: Project standards, implementation guidelines (this file)
   - **README.md**: User-facing documentation, setup instructions, project description
   - **Code comments**: Inline documentation for complex logic
   - **API documentation**: If the project has API docs, update them

2. **Update CLAUDE.md when**:
   - New architectural patterns are introduced
   - New directories or file structures are added
   - Implementation guidelines need clarification
   - New protected systems are identified

3. **Update README.md when**:
   - User-facing features are added
   - Setup or deployment instructions change
   - Project description needs updating
   - New environment variables are required

4. **Update code comments when**:
   - Complex logic is added
   - Business rules change
   - Non-obvious implementation decisions are made

5. **Keep documentation accurate**:
   - Remove outdated information
   - Update file paths if files are moved
   - Ensure examples still work
   - Verify links and references

**Note**: If a feature simply asks to "update the documentation" without specifics, update relevant code comments and consider if README.md needs updates. Ask for clarification if uncertain which documentation they mean.

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