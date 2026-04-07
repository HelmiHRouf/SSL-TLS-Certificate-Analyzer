import type { CipherSuite, ProtocolSupport, VulnResult, Grade } from "@/types/cert";

const SSL_LABS_API_BASE = "https://api.ssllabs.com/api/v3";

export interface SSLLabsEndpoint {
  ipAddress: string;
  grade?: Grade;
  hasWarnings?: boolean;
  isExceptional?: boolean;
  details?: {
    // SSL Labs v3 returns only supported protocols in this array (no `supported` field)
    protocols?: {
      id: number;
      name: string;
      version: string;
    }[];
    suites?: {
      protocol: number;
      list: {
        name: string;
        cipherStrength: number;
        kxType?: string;
        kxStrength?: number;
      }[];
    }[];
    heartbleed?: boolean;
    heartbeat?: boolean;
    poodle?: boolean;
    poodleTls?: boolean;
    beast?: boolean;
    lucky13?: boolean;
    rc4Only?: boolean;
    rc4?: boolean;
    forwardSecrecy?: number;
    drownVulnerable?: boolean;
    logjam?: boolean;
    freak?: boolean;
  };
}

export interface SSLLabsResult {
  host: string;
  status: "DNS" | "ERROR" | "IN_PROGRESS" | "READY";
  startTime: number;
  testTime?: number;
  endpoints?: SSLLabsEndpoint[];
  statusMessage?: string;
}

/**
 * Start a new SSL Labs scan (fire-and-forget)
 * Returns immediately — the scan runs asynchronously
 * Uses fromCache=on first to avoid overloading the API
 */
export async function startScan(domain: string): Promise<void> {
  const url = new URL(`${SSL_LABS_API_BASE}/analyze`);
  url.searchParams.set("host", domain);
  url.searchParams.set("publish", "off");
  url.searchParams.set("ignoreMismatch", "on");
  url.searchParams.set("all", "done");

  // First, try fromCache=on to see if there's already a cached result
  // This avoids creating new scans for domains recently scanned
  const cacheUrl = new URL(url.toString());
  cacheUrl.searchParams.set("fromCache", "on");

  const cacheResponse = await fetch(cacheUrl.toString());
  if (cacheResponse.ok) {
    const cacheData: SSLLabsResult = await cacheResponse.json();
    // If we have a READY cached result, no need to start a new scan
    if (cacheData.status === "READY") {
      return;
    }
    // If there's an in-progress scan, just wait for it
    if (cacheData.status === "IN_PROGRESS") {
      return;
    }
  }

  // No cached result, start fresh scan
  url.searchParams.set("startNew", "on");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // 529 = API at capacity — this is expected, log as warning not error
    if (response.status === 529) {
      console.warn(
        `SSL Labs API at capacity (529) for ${domain}. Falling back to local analysis.`
      );
      return;
    }
    // Other errors still logged
    console.error(
      "Failed to start SSL Labs scan:",
      response.status,
      response.statusText,
      body
    );
  }
}

/**
 * Poll SSL Labs for scan status
 * Returns { status: 'pending' } or the full SSLLabsResult
 */
export async function getScanStatus(
  domain: string
): Promise<{ status: "pending" } | SSLLabsResult> {
  const url = new URL(`${SSL_LABS_API_BASE}/analyze`);
  url.searchParams.set("host", domain);
  url.searchParams.set("publish", "off");
  url.searchParams.set("ignoreMismatch", "on");
  url.searchParams.set("all", "done");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `SSL Labs API error: ${response.status} ${response.statusText} - ${body}`
    );
  }

  const data: SSLLabsResult = await response.json();

  if (data.status === "READY") {
    return data;
  }

  // Still processing
  return { status: "pending" };
}

/**
 * Map SSL Labs protocol data to our ProtocolSupport format.
 * SSL Labs v3 returns only the *supported* protocols in the array —
 * presence in the array means supported, absence means not supported.
 */
export function mapProtocols(protocols?: { id?: number; name: string; version: string }[]): ProtocolSupport[] {
  const allVersions = [
    { version: "TLS 1.3", risk: "none" as const },
    { version: "TLS 1.2", risk: "none" as const },
    { version: "TLS 1.1", risk: "low" as const },
    { version: "TLS 1.0", risk: "high" as const },
    { version: "SSL 3.0", risk: "high" as const },
  ];

  if (!protocols) {
    return allVersions.map((p) => ({ ...p, supported: false }));
  }

  return allVersions.map((p) => {
    const match = protocols.find(
      (proto) => `${proto.name} ${proto.version}` === p.version
    );
    return {
      version: p.version,
      // Presence in the SSL Labs protocols array means it IS supported
      supported: match !== undefined,
      risk: p.risk,
    };
  });
}

/**
 * Map SSL Labs cipher suites to our format
 */
export function mapCipherSuites(
  suites?: { protocol: number; list: { name: string; cipherStrength: number; kxType?: string; kxStrength?: number }[] }[]
): CipherSuite[] {
  if (!suites || suites.length === 0) return [];

  const ciphers: CipherSuite[] = [];

  for (const suite of suites) {
    for (const cipher of suite.list || []) {
      // cipherStrength is bit-length (e.g. 128, 256) in SSL Labs v3
      let strength: CipherSuite["strength"];
      if (cipher.cipherStrength >= 128) strength = "strong";
      else if (cipher.cipherStrength >= 112) strength = "acceptable";
      else if (cipher.cipherStrength >= 56) strength = "weak";
      else strength = "insecure";

      ciphers.push({
        name: cipher.name,
        strength,
        kex: cipher.kxType || "Unknown",
        auth: "RSA", // SSL Labs doesn't expose this separately
        enc: "AES", // Simplified — full parsing is complex
        mac: "SHA256",
      });
    }
  }

  return ciphers;
}

/**
 * Map SSL Labs vulnerabilities to our VulnResult format
 */
export function mapVulnerabilities(details?: SSLLabsEndpoint["details"]): VulnResult[] {
  const vulns: VulnResult[] = [
    { name: "Heartbleed", slug: "heartbleed", safe: true },
    { name: "POODLE", slug: "poodle", safe: true },
    { name: "BEAST", slug: "beast", safe: true },
    { name: "ROBOT", slug: "robot", safe: true },
    { name: "DROWN", slug: "drown", safe: true },
    { name: "FREAK", slug: "freak", safe: true },
    { name: "Logjam", slug: "logjam", safe: true },
  ];

  if (!details) return vulns;

  // Update safety based on SSL Labs results
  if (details.heartbleed !== undefined) {
    const heartbleed = vulns.find((v) => v.slug === "heartbleed");
    if (heartbleed) heartbleed.safe = !details.heartbleed;
  }

  if (details.poodle !== undefined) {
    const poodle = vulns.find((v) => v.slug === "poodle");
    if (poodle) poodle.safe = !details.poodle;
  }

  if (details.beast !== undefined) {
    const beast = vulns.find((v) => v.slug === "beast");
    if (beast) beast.safe = !details.beast;
  }

  if (details.drownVulnerable !== undefined) {
    const drown = vulns.find((v) => v.slug === "drown");
    if (drown) drown.safe = !details.drownVulnerable;
  }

  if (details.freak !== undefined) {
    const freak = vulns.find((v) => v.slug === "freak");
    if (freak) freak.safe = !details.freak;
  }

  if (details.logjam !== undefined) {
    const logjam = vulns.find((v) => v.slug === "logjam");
    if (logjam) logjam.safe = !details.logjam;
  }

  // ROBOT is not directly reported by SSL Labs v3 API
  // We'll infer from cipher suites in the grading step

  return vulns;
}

/**
 * Get grade from SSL Labs result
 */
export function getGrade(endpoints?: SSLLabsEndpoint[]): Grade | undefined {
  if (!endpoints || endpoints.length === 0) return undefined;
  return endpoints[0].grade;
}
