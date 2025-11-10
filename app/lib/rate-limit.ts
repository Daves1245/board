import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Check if Redis is configured
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

let redis: Redis | undefined
let featureSubmissionLimit: Ratelimit | undefined
let signupLimit: Ratelimit | undefined
let voteLimit: Ratelimit | undefined

if (isRedisConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  // Feature submissions: 3 per day per user
  featureSubmissionLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 d"),
    analytics: true,
  })

  // Signups: 2 per day per IP
  signupLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, "1 d"),
    analytics: true,
  })

  // Vote rate limiting: 10 per minute per user
  voteLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
  })
}

// Helper functions that gracefully handle missing Redis
export async function checkFeatureSubmissionLimit(userId: string): Promise<{ success: boolean }> {
  if (!featureSubmissionLimit) {
    console.log('Redis not configured, skipping feature submission rate limit')
    return { success: true }
  }
  return await featureSubmissionLimit.limit(userId)
}

export async function checkSignupLimit(ip: string): Promise<{ success: boolean }> {
  if (!signupLimit) {
    console.log('Redis not configured, skipping signup rate limit')
    return { success: true }
  }
  return await signupLimit.limit(ip)
}

export async function checkVoteLimit(userId: string): Promise<{ success: boolean }> {
  // TEMPORARILY DISABLED FOR TESTING - Always allow voting
  console.log('Vote rate limiting temporarily disabled for testing')
  return { success: true }
  
  // Original rate limiting code (commented out for testing)
  // if (!voteLimit) {
  //   console.log('Redis not configured, skipping vote rate limit')
  //   return { success: true }
  // }
  // return await voteLimit.limit(userId)
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("cf-connecting-ip") || 
                   request.headers.get("x-forwarded-for")
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return request.headers.get("x-real-ip") || "unknown"
}