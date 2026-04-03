import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { fetchCertChain } from "@/lib/tls";
import { fetchSecurityHeaders } from "@/lib/headers";
import { computeGrade } from "@/lib/grader";
import { db } from "@/lib/db";
import { scans } from "@/lib/schema";
import { getCache, setCache, clearCache } from "@/lib/cache";
import { startScan } from "@/lib/ssllabs";
import type { ScanResult, ProtocolSupport, VulnResult } from "@/types/cert";

// Domain validation schema per spec
const domainSchema = z.object({
  domain: z
    .string()
    .transform((s) =>
      s
        .replace(/^https?:\/\//i, "")
        .split("/")[0]
        .trim(),
    )
    .pipe(
      z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9\-\.]{1,253}[a-zA-Z0-9]$/),
    ),
  force: z.boolean().optional().default(false),
});

// Placeholder protocol check — will be replaced with actual TLS version detection
async function detectProtocols(domain: string): Promise<ProtocolSupport[]> {
  // For now, return optimistic defaults
  // Phase 4 will integrate SSL Labs for real protocol detection
  return [
    { version: "TLS 1.3", supported: true, risk: "none" },
    { version: "TLS 1.2", supported: true, risk: "none" },
    { version: "TLS 1.1", supported: false, risk: "low" },
    { version: "TLS 1.0", supported: false, risk: "high" },
    { version: "SSL 3.0", supported: false, risk: "high" },
  ];
}

// Placeholder vulnerabilities — will be replaced with SSL Labs data
function getPlaceholderVulns(): VulnResult[] {
  return [
    { name: "Heartbleed", slug: "heartbleed", safe: true },
    { name: "POODLE", slug: "poodle", safe: true },
    { name: "BEAST", slug: "beast", safe: true },
    { name: "ROBOT", slug: "robot", safe: true },
    { name: "DROWN", slug: "drown", safe: true },
    { name: "FREAK", slug: "freak", safe: true },
    { name: "Logjam", slug: "logjam", safe: true },
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { domain, force } = domainSchema.parse(body);

    // 1. Check cache first (unless force=true for re-scan)
    if (!force) {
      const cached = await getCache(domain);
      if (cached) {
        // Return cached result immediately
        return NextResponse.json(cached);
      }
    } else {
      // Force refresh: clear existing cache
      await clearCache(domain);
    }

    // 2. Run cert extraction and headers in parallel (both fast, <2s)
    const [chain, headers, protocols] = await Promise.all([
      fetchCertChain(domain),
      fetchSecurityHeaders(domain),
      detectProtocols(domain),
    ]);

    // Get placeholder vulns and empty cipher suites (Phase 4 adds real ones)
    const vulnerabilities = getPlaceholderVulns();
    const cipherSuites: ScanResult["cipherSuites"] = [];

    // Compute grade based on what we have
    const grade = computeGrade({
      chain,
      protocols,
      cipherSuites,
      vulnerabilities,
    });

    // Generate shareId and assemble result
    const shareId = nanoid(8);
    const scannedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days TTL

    const result: ScanResult = {
      domain,
      grade,
      chain,
      protocols,
      cipherSuites,
      vulnerabilities,
      headers,
      scannedAt,
      shareId,
    };

    // 3. Kick off SSL Labs deep scan (fire-and-forget, don't await)
    startScan(domain).catch((err) => {
      console.error("Failed to start SSL Labs scan:", err);
    });

    // 4. Persist to KV cache (non-blocking)
    await setCache(domain, result);

    // 5. Persist to Neon (non-blocking — don't fail the response if DB is down)
    try {
      await db.insert(scans).values({
        shareId,
        domain,
        grade,
        result: result as unknown as Record<string, unknown>,
        scannedAt: new Date(scannedAt),
        expiresAt,
      });
    } catch (dbErr) {
      // Log but don't fail — scan result is still valid
      console.error("Failed to persist scan:", dbErr);
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 },
      );
    }

    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 },
    );
  }
}
