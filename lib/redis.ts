import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let _redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log("[Redis] Env vars missing — falling back to in-memory");
    _redis = null;
    return null;
  }

  _redis = new Redis({ url, token });
  console.log("[Redis] Connected to Upstash");
  return _redis;
}

const _rateLimiters = new Map<string, Ratelimit>();

export function getRateLimiter(
  type: string,
  requests: number,
  windowMs: number
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const key = `${type}:${requests}:${windowMs}`;
  const cached = _rateLimiters.get(key);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowMs} ms`),
    prefix: `rl:${type}`,
  });

  _rateLimiters.set(key, limiter);
  return limiter;
}

// Redis cache helpers
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Silently fail — cache is optional
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
}
