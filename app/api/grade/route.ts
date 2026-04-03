import { NextResponse } from "next/server";
import { z } from "zod";
import { getScanStatus, mapProtocols, mapCipherSuites, mapVulnerabilities, getGrade } from "@/lib/ssllabs";
import { getCache, setCache } from "@/lib/cache";
import type { ScanResult } from "@/types/cert";

const querySchema = z.object({
  domain: z.string().min(1),
});

export async function GET(req: Request) {
  try {
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

    // Poll SSL Labs for scan status
    const sslLabsResult = await getScanStatus(validDomain);

    if ("status" in sslLabsResult && sslLabsResult.status === "pending") {
      // Scan still in progress
      return NextResponse.json({ status: "pending" });
    }

    // Scan is ready — get the first endpoint
    const endpoint = sslLabsResult.endpoints?.[0];
    if (!endpoint) {
      return NextResponse.json(
        { error: "No endpoint data available" },
        { status: 500 }
      );
    }

    // Get cached scan result to merge with SSL Labs data
    const cached = await getCache(validDomain);
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
      grade: getGrade(sslLabsResult.endpoints) || baseResult.grade || "B",
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
