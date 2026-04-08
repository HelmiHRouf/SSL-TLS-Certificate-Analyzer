import tls from "tls";
import net from "net";
import dns from "dns/promises";
import type { ChainEntry, ProtocolSupport } from "@/types/cert";

// Private IP ranges to block (SSRF protection)
const PRIVATE_IP_PATTERNS = [
  /^127\./, // loopback
  /^10\./, // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
  /^192\.168\./, // Class B private
  /^169\.254\./, // Link-local
  /^0\./, // Current network
  /^fc00:/i, // IPv6 unique local
  /^fe80:/i, // IPv6 link-local
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

export async function fetchCertChain(domain: string): Promise<ChainEntry[]> {
  // Resolve domain first to check for private IPs (SSRF protection)
  // Add 5s timeout for DNS lookup to prevent indefinite hangs
  try {
    const dnsPromise = dns.lookup(domain);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("DNS lookup timeout after 5 seconds")), 5000);
    });
    const { address } = await Promise.race([dnsPromise, timeoutPromise]);

    if (isPrivateIP(address)) {
      throw new Error(
        `Cannot scan private IP addresses (${address}). Please provide a public domain.`,
      );
    }
  } catch (err) {
    // If DNS lookup fails or times out, throw error
    // Don't proceed without DNS check to maintain SSRF protection
    if (err instanceof Error && err.message.includes("private IP")) {
      throw err;
    }
    if (err instanceof Error && err.message.includes("timeout")) {
      throw new Error(`DNS lookup for ${domain} timed out. Domain may not exist or DNS is slow.`);
    }
    // Other DNS errors - domain likely doesn't exist
    throw new Error(`Failed to resolve domain ${domain}: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        timeout: 8000, // 8s timeout in connection options
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        socket.destroy();

        try {
          const chain = parseCertChain(cert);
          resolve(chain);
        } catch (err) {
          reject(err);
        }
      },
    );

    socket.on("error", (err) => {
      reject(err);
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Connection timeout after 8 seconds"));
    });

  });
}

function parseCertChain(cert: tls.PeerCertificate): ChainEntry[] {
  const chain: ChainEntry[] = [];

  // Build chain from leaf to root
  let current: tls.PeerCertificate | undefined = cert;
  let iterations = 0;
  const MAX_ITERATIONS = 10; // Safety limit
  const seenFingerprints = new Set<string>();

  while (current && iterations < MAX_ITERATIONS) {
    iterations++;

    const entry = parseCertEntry(current, chain.length);
    chain.push(entry);

    // Track seen fingerprints to detect circular chains
    if (current.fingerprint) {
      if (seenFingerprints.has(current.fingerprint)) {
        // Circular reference detected
        break;
      }
      seenFingerprints.add(current.fingerprint);
    }

    // Next cert in chain (if available)
    // @ts-ignore - issuerCertificate exists at runtime but not in types
    const nextCert: tls.PeerCertificate | undefined = current.issuerCertificate;

    // Stop if: no next cert, or next cert is the same as current (self-signed root)
    if (!nextCert || nextCert.fingerprint === current.fingerprint) {
      break;
    }
    current = nextCert;
  }

  // Reverse so root is first, leaf is last
  return chain.reverse();
}

function parseCertEntry(
  cert: tls.PeerCertificate,
  index: number,
): ChainEntry {
  const subject = String(cert.subject?.CN || cert.subject?.O || "Unknown");
  const issuer = String(cert.issuer?.CN || cert.issuer?.O || "Unknown");
  const locality = cert.subject?.L ? String(cert.subject.L) : undefined;
  const state = cert.subject?.ST ? String(cert.subject.ST) : undefined;
  const country = cert.subject?.C ? String(cert.subject.C) : undefined;

  // Parse dates
  const validFrom = cert.valid_from
    ? new Date(cert.valid_from).toISOString()
    : "";
  const validTo = cert.valid_to ? new Date(cert.valid_to).toISOString() : "";

  // Calculate days remaining
  const now = new Date();
  const expiry = validTo ? new Date(validTo) : null;
  const daysRemaining = expiry
    ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Determine role based on position and self-signed status
  // @ts-ignore - issuerCertificate exists at runtime but not in types
  const issuerCert: tls.PeerCertificate | undefined = cert.issuerCertificate;
  const hasNextCert = !!issuerCert;
  const isSelfSigned = subject === issuer;

  let role: ChainEntry["role"];
  if (index === 0 && !hasNextCert) {
    // Single cert (self-signed root or no chain)
    role = "root";
  } else if (index === 0 && hasNextCert) {
    // First cert with more to come = leaf
    role = "leaf";
  } else if (!hasNextCert || isSelfSigned) {
    // Last cert in chain = root
    role = "root";
  } else {
    role = "intermediate";
  }

  // Parse SANs from subjectaltname field
  const sans: string[] = [];
  if (cert.subjectaltname) {
    // Format: "DNS:example.com, DNS:www.example.com, IP Address:1.2.3.4"
    const altNames = cert.subjectaltname.split(", ");
    for (const alt of altNames) {
      if (alt.startsWith("DNS:")) {
        sans.push(alt.replace("DNS:", ""));
      }
    }
  }

  // Extract key info from public key
  const modulus = (cert as unknown as { modulus?: string }).modulus;
  const keyType = modulus ? `RSA ${Math.ceil(modulus.length / 2) * 8}-bit` : "Unknown";

  // Signature algorithm (best effort from available fields)
  const signatureAlg = (cert as unknown as { sigalgs?: string[] }).sigalgs?.[0] || "Unknown";

  // Wildcard check
  const isWildcard = sans.some((san) => san.startsWith("*.")) ||
    subject.startsWith("*.") ||
    false;

  // Expired check
  const isExpired = expiry ? expiry < now : false;

  // Extract raw certificate PEM for advanced inspection
  let rawPem: string | undefined;
  if (cert.raw && Buffer.isBuffer(cert.raw)) {
    const base64 = cert.raw.toString("base64");
    // Chunk into 64-character lines for standard PEM format
    const chunks = base64.match(/.{1,64}/g) || [base64];
    rawPem = `-----BEGIN CERTIFICATE-----\n${chunks.join("\n")}\n-----END CERTIFICATE-----`;
  }

  return {
    subject,
    issuer,
    locality,
    state,
    country,
    validFrom,
    validTo,
    daysRemaining,
    serialNumber: cert.serialNumber || "",
    keyType,
    signatureAlg,
    sans,
    isWildcard,
    isSelfSigned,
    isExpired,
    role,
    rawPem,
  };
}

// Protocol detection by attempting connections with specific pinned versions.
// Uses minVersion + maxVersion (Node.js ≥ 10.16) instead of the legacy
// secureOptions bit-flags, which are unreliable across OpenSSL versions.
// SSL 3.0 is probed separately via a raw TCP hand-crafted ClientHello because
// OpenSSL 1.1+ removed SSL 3.0 from its TLS stack entirely.
//
// IMPORTANT: Node.js 18+ / OpenSSL 3.x blocks outgoing TLS 1.0 and 1.1
// connections at the library level (legacy sigalg disallowed) regardless of
// minVersion/maxVersion settings. TLS 1.0/1.1 detection is therefore marked
// "unknown" and delegated to SSL Labs deep-scan data which runs its own scanner.
export async function detectProtocols(domain: string): Promise<ProtocolSupport[]> {
  const DETECTION_TIMEOUT = 5000;

  const [tls13, tls12, ssl30] = await Promise.all([
    testProtocolVersion(domain, "TLSv1.3", "TLSv1.3", DETECTION_TIMEOUT),
    testProtocolVersion(domain, "TLSv1.2", "TLSv1.2", DETECTION_TIMEOUT),
    probeSSL30(domain, DETECTION_TIMEOUT),
  ]);

  return [
    { version: "TLS 1.3", supported: tls13,  detectionStatus: "detected", risk: "none" },
    { version: "TLS 1.2", supported: tls12,  detectionStatus: "detected", risk: "none" },
    // TLS 1.1/1.0 cannot be probed from Node.js 18+/OpenSSL 3.x — deferred to SSL Labs
    { version: "TLS 1.1", supported: false,  detectionStatus: "unknown",  risk: "low"  },
    { version: "TLS 1.0", supported: false,  detectionStatus: "unknown",  risk: "high" },
    { version: "SSL 3.0", supported: ssl30,  detectionStatus: "detected", risk: "high" },
  ];
}

async function testProtocolVersion(
  domain: string,
  minVersion: tls.SecureVersion,
  maxVersion: tls.SecureVersion,
  timeout: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        timeout,
        minVersion,
        maxVersion,
      },
      () => {
        // Connection callback fires only when the TLS handshake succeeded,
        // meaning the server genuinely supports this pinned version.
        socket.destroy();
        resolve(true);
      },
    );

    socket.on("error", () => resolve(false));
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
  });
}

/**
 * Probe whether a server accepts SSL 3.0 by sending a hand-crafted ClientHello
 * over a raw TCP socket. Node.js's TLS library dropped SSL 3.0 in OpenSSL 1.1+
 * so we can't use tls.connect for this — we go one level lower.
 *
 * The packet structure:
 *   [Record layer]    0x16 (Handshake) | 0x03 0x00 (SSL 3.0) | 2-byte length
 *   [Handshake layer] 0x01 (ClientHello) | 3-byte length
 *   [ClientHello]     version | 32-byte random | session-id | cipher suites | compression
 *
 * Response interpretation:
 *   First byte 0x16 → ServerHello  → SSL 3.0 supported
 *   First byte 0x15 → Alert        → server rejected SSL 3.0
 *   Connection closed / timeout    → not supported
 */
async function probeSSL30(domain: string, timeout: number): Promise<boolean> {
  // Minimal SSL 3.0 ClientHello (47-byte record body, 43-byte handshake body)
  const clientHello = Buffer.from([
    // ── TLS Record Layer ──────────────────────────────
    0x16,       // ContentType: Handshake
    0x03, 0x00, // Version: SSL 3.0
    0x00, 0x2f, // Length: 47 bytes

    // ── Handshake Layer ───────────────────────────────
    0x01,             // HandshakeType: ClientHello
    0x00, 0x00, 0x2b, // Length: 43 bytes

    // ── ClientHello body ──────────────────────────────
    0x03, 0x00, // ClientVersion: SSL 3.0
    // 32 bytes of random (gmt_unix_time + random_bytes)
    0x00, 0x00, 0x00, 0x00, // gmt_unix_time (4 bytes)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // random (28 bytes)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00,       // SessionID length: 0
    0x00, 0x04, // CipherSuites length: 4 bytes (2 suites)
    0x00, 0x04, // TLS_RSA_WITH_RC4_128_MD5
    0x00, 0x05, // TLS_RSA_WITH_RC4_128_SHA
    0x01,       // CompressionMethods length: 1
    0x00,       // null compression
  ]);

  return new Promise((resolve) => {
    let resolved = false;
    const done = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    const timer = setTimeout(() => done(false), timeout);

    const socket = net.connect({ host: domain, port: 443 }, () => {
      socket.write(clientHello);
    });

    socket.once("data", (data) => {
      clearTimeout(timer);
      // 0x16 = Handshake record (ServerHello) → SSL 3.0 accepted
      // 0x15 = Alert record → rejected
      done(data[0] === 0x16);
    });

    socket.on("error", () => { clearTimeout(timer); done(false); });
    socket.on("close", () => { clearTimeout(timer); done(false); });
  });
}
