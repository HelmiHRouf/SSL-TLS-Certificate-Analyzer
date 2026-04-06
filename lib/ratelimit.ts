import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

/**
 * Rate limiter configurations by endpoint
 * - slidingWindow: uses Redis sorted sets for precise tracking
 * - limiter: number of requests allowed in the window
 * - analytics: optional, tracks deny rates
 */

// General API rate limiter: 100 req/hour per IP
export const generalLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  analytics: true,
  prefix: "ratelimit:general",
});

// Analyze endpoint: 30 req/hour per IP (TLS cert checks)
export const analyzeLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  analytics: true,
  prefix: "ratelimit:analyze",
});

// Grade endpoint: 10 req/hour per IP (expensive SSL Labs scans)
export const gradeLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "ratelimit:grade",
});

/**
 * Extract IP from request headers
 * Falls back to "anonymous" if IP cannot be determined
 */
export function getIP(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // X-Forwarded-For can contain multiple IPs; use the first (client)
    return xff.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  // Fallback for development
  return "anonymous";
}
