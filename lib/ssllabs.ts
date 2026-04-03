import type { CipherSuite, ProtocolSupport, VulnResult, Grade } from "@/types/cert";

const SSL_LABS_API_BASE = "https://api.ssllabs.com/api/v3";

export interface SSLLabsEndpoint {
  ipAddress: string;
  grade?: Grade;
  hasWarnings?: boolean;
  isExceptional?: boolean;
  details?: {
    protocolSupport?: {
      name: string;
      version: string;
      supported: boolean;
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
 */
export async function startScan(domain: string): Promise<void> {
  const url = new URL(`${SSL_LABS_API_BASE}/analyze`);
  url.searchParams.set("host", domain);
  url.searchParams.set("startNew", "on");
  url.searchParams.set("publish", "off");
  url.searchParams.set("ignoreMismatch", "on");
  url.searchParams.set("all", "done");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => "");
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
 * Map SSL Labs protocol data to our ProtocolSupport format
 */
export function mapProtocols(protocols?: { name: string; version: string; supported: boolean }[]): ProtocolSupport[] {
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
      supported: match?.supported ?? false,
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
      // Map cipherStrength (0-100) to our strength categories
      let strength: CipherSuite["strength"];
      if (cipher.cipherStrength >= 80) strength = "strong";
      else if (cipher.cipherStrength >= 60) strength = "acceptable";
      else if (cipher.cipherStrength >= 40) strength = "weak";
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