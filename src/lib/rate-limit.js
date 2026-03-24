import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimitAuth;
let ratelimitRefresh;
let ratelimitApi;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function getAuthRateLimit() {
  if (ratelimitAuth) return ratelimitAuth;
  const redis = getRedis();
  if (redis) {
    ratelimitAuth = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      prefix: "gym:auth",
    });
  } else {
    ratelimitAuth = {
      limit: async () => ({ success: true, remaining: 999 }),
    };
  }
  return ratelimitAuth;
}

/** Token refresh: allow bursts from multiple tabs without being too strict */
export function getTokenRefreshRateLimit() {
  if (ratelimitRefresh) return ratelimitRefresh;
  const redis = getRedis();
  if (redis) {
    ratelimitRefresh = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "15 m"),
      prefix: "gym:refresh",
    });
  } else {
    ratelimitRefresh = {
      limit: async () => ({ success: true, remaining: 999 }),
    };
  }
  return ratelimitRefresh;
}

export function getApiRateLimit() {
  if (ratelimitApi) return ratelimitApi;
  const redis = getRedis();
  if (redis) {
    ratelimitApi = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "1 m"),
      prefix: "gym:api",
    });
  } else {
    ratelimitApi = {
      limit: async () => ({ success: true, remaining: 999 }),
    };
  }
  return ratelimitApi;
}

export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
