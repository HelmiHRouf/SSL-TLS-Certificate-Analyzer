import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { fetchCertChain } from "@/lib/tls";
import { fetchSecurityHeaders } from "@/lib/headers";
import { computeGrade } from "@/lib/grader";
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
    const { domain } = domainSchema.parse(body);

    // Run cert extraction and headers in parallel (both fast, <2s)
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

    // Assemble result (no DB persistence yet per Phase 1)
    const result: ScanResult = {
      domain,
      grade,
      chain,
      protocols,
      cipherSuites,
      vulnerabilities,
      headers,
      scannedAt: new Date().toISOString(),
      shareId: nanoid(8),
    };

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
