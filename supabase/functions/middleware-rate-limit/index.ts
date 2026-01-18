
import { Redis } from 'https://deno.land/x/upstash_redis@v1.22.0/mod.ts'

export async function rateLimit(req: Request, userId: string, limit: number = 100, window: number = 60): Promise<boolean> {
  // If no Redis URL is configured, skip rate limiting (dev mode or not configured)
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')

  if (!redisUrl || !redisToken) {
    console.warn('Rate limiting skipped: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set')
    return true
  }

  try {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    const key = `rate_limit:${userId}`
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, window)
    }

    return current <= limit
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open if Redis is down
    return true
  }
}
