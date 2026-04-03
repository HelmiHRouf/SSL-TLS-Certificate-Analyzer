import { kv } from "@vercel/kv";
import type { ScanResult } from "@/types/cert";

const CACHE_TTL_SECONDS = 3600; // 1 hour default

/**
 * Get cached scan result for a domain
 * Returns null if not found or on error
 */
export async function getCache(domain: string): Promise<ScanResult | null> {
  try {
    const key = `scan:${domain}`;
    const cached = await kv.get<ScanResult>(key);
    return cached ?? null;
  } catch (err) {
    console.error("KV getCache error:", err);
    return null;
  }
}

/**
 * Store scan result in cache with optional TTL (default 1 hour)
 */
export async function setCache(
  domain: string,
  result: ScanResult,
  ttl: number = CACHE_TTL_SECONDS
): Promise<void> {
  try {
    const key = `scan:${domain}`;
    await kv.set(key, result, { ex: ttl });
  } catch (err) {
    console.error("KV setCache error:", err);
    // Non-blocking — cache failures shouldn't fail the scan
  }
}

/**
 * Clear cache for a domain (used for re-scan / force refresh)
 */
export async function clearCache(domain: string): Promise<void> {
  try {
    const key = `scan:${domain}`;
    await kv.del(key);
  } catch (err) {
    console.error("KV clearCache error:", err);
  }
}