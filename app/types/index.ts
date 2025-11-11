export interface User {
  id: string
  username: string
  displayName: string
  isStaff?: boolean
}

export interface Feature {
  id: string
  title: string
  description: string
  createdAt: string
  status: 'pending' | 'implementing' | 'implemented'
  implementationStartedAt?: string | null
  implementedAt?: string | null
  creator: User
  voteTotal: number
  userHasVoted: boolean
  parent?: { id: string; title: string } | null
  variationCount?: number
  lastUpvoteAt?: string | null
}

export interface FeaturesResponse {
  features: Feature[]
  implementingFeatures: Feature[]
  implementedFeatures: Feature[]
  canSubmit: boolean
  user: User | null
}

export interface VoteResponse {
  action: 'added' | 'removed'
  hasVoted: boolean
  voteTotal: number
  implementing?: boolean
  status?: 'pending' | 'implementing' | 'implemented'
  message?: string
}