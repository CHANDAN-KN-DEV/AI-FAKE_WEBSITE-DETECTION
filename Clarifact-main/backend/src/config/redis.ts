import IORedis from "ioredis";
import { env } from "./env";

// Create a Redis client that suppresses connection errors in dev
// so the HTTP server can still start without Redis.
export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    // Retry with exponential backoff, cap at 30s, max 5 attempts total
    if (times > 5) return null; // stop retrying
    return Math.min(times * 1000, 30_000);
  }
});

redis.on("error", (err: Error) => {
  // Only log once per minute to avoid flooding
  if ((redis as any)._lastRedisLog !== Math.floor(Date.now() / 60000)) {
    (redis as any)._lastRedisLog = Math.floor(Date.now() / 60000);
    console.warn("[Redis] Connection error (queue features disabled):", err.message);
  }
});
