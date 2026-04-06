import { NextResponse } from "next/server";
import { z } from "zod";
import { getScanStatus, mapProtocols, mapCipherSuites, mapVulnerabilities, getGrade } from "@/lib/ssllabs";
import { getCache, setCache } from "@/lib/cache";
import { gradeLimiter, getIP } from "@/lib/ratelimit";
import type { ScanResult } from "@/types/cert";

const querySchema = z.object({
  domain: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    // Apply rate limiting
    const ip = getIP(req);
    const { success, limit, remaining, reset } = await gradeLimiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded", 
          limit,
          remaining: 0,
          reset: new Date(reset).toISOString(),
        },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(0),
            "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
          },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");

    const parsed = querySchema.safeParse({ domain });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Domain parameter is required" },
        { status: 400 }
      );
    }

    const { domain: validDomain } = parsed.data;

    // Get cached scan result first (needed for fallback)
    const cached = await getCache(validDomain);

    // Poll SSL Labs for scan status
    let sslLabsResult;
    try {
      sslLabsResult = await getScanStatus(validDomain);
    } catch (sslErr) {
      // SSL Labs API error — return fallback with local data
      if (cached) {
        return NextResponse.json({
          ...cached,
          sslLabsStatus: "unavailable",
        });
      }
      return NextResponse.json(
        { error: "SSL Labs unavailable and no cached data", status: "error" },
        { status: 503 }
      );
    }

    // Check if scan is still pending (narrow type first)
    const isPending = "status" in sslLabsResult && sslLabsResult.status === "pending";
    if (isPending) {
      return NextResponse.json({ status: "pending" });
    }

    // At this point TypeScript knows it's SSLLabsResult
    const result = sslLabsResult as Exclude<typeof sslLabsResult, { status: "pending" }>;
    const endpoint = result.endpoints?.[0];
    if (!endpoint) {
      return NextResponse.json(
        { error: "No endpoint data available" },
        { status: 500 }
      );
    }

    // Use cached result as base for merging
    const baseResult: Partial<ScanResult> = cached || {
      domain: validDomain,
      chain: [],
      headers: [],
      scannedAt: new Date().toISOString(),
      shareId: "",
    };

    // Merge SSL Labs data with existing scan result
    const updatedResult: ScanResult = {
      ...baseResult,
      domain: validDomain,
      grade: getGrade(result.endpoints) || baseResult.grade || "B",
      protocols: mapProtocols(endpoint.details?.protocolSupport),
      cipherSuites: mapCipherSuites(endpoint.details?.suites),
      vulnerabilities: mapVulnerabilities(endpoint.details),
      scannedAt: new Date().toISOString(),
      // Preserve these from original scan if available
      chain: baseResult.chain || [],
      headers: baseResult.headers || [],
      shareId: baseResult.shareId || "",
    };

    // Update cache with enhanced result
    await setCache(validDomain, updatedResult);

    return NextResponse.json(updatedResult);
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message, status: "error" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Unknown error occurred", status: "error" },
      { status: 500 }
    );
  }
}
