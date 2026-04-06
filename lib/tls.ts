import tls from "tls";
import dns from "dns/promises";
import type { ChainEntry, ProtocolSupport } from "@/types/cert";
import { constants } from "crypto";

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

// SSL/TLS version constants for protocol detection
const SSL3_HEADER = Buffer.from([0x16, 0x03, 0x00]); // SSL 3.0 record header

// Protocol detection by attempting connections with specific versions
export async function detectProtocols(domain: string): Promise<ProtocolSupport[]> {
  const protocols: ProtocolSupport[] = [
    { version: "TLS 1.3", supported: false, risk: "none" },
    { version: "TLS 1.2", supported: false, risk: "none" },
    { version: "TLS 1.1", supported: false, risk: "low" },
    { version: "TLS 1.0", supported: false, risk: "high" },
    { version: "SSL 3.0", supported: false, risk: "high" },
  ];

  const DETECTION_TIMEOUT = 5000; // 5s timeout per protocol test

  // Test each protocol version
  const tests = protocols.map(async (proto) => {
    const supported = await testProtocolVersion(domain, proto.version, DETECTION_TIMEOUT);
    proto.supported = supported;
    return proto;
  });

  await Promise.all(tests);
  return protocols;
}

async function testProtocolVersion(
  domain: string,
  version: string,
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
        // Map version string to secureOptions
        secureOptions: getSecureOptionsForVersion(version),
      },
      () => {
        // Get the negotiated protocol
        const negotiated = socket.getProtocol();
        socket.destroy();

        // Check if the negotiated protocol matches what we expected
        const expectedProto = versionToProtocolString(version);
        resolve(negotiated === expectedProto);
      },
    );

    socket.on("error", () => {
      resolve(false);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function getSecureOptionsForVersion(version: string): number | undefined {
  // Use OpenSSL constants to force specific TLS versions
  // SSL_OP_NO_TLSv1_2 etc. are negative flags (disabling higher versions)
  switch (version) {
    case "SSL 3.0":
      return constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1 |
             constants.SSL_OP_NO_TLSv1_2 | constants.SSL_OP_NO_TLSv1_3;
    case "TLS 1.0":
      return constants.SSL_OP_NO_TLSv1_1 | constants.SSL_OP_NO_TLSv1_2 |
             constants.SSL_OP_NO_TLSv1_3;
    case "TLS 1.1":
      return constants.SSL_OP_NO_TLSv1_2 | constants.SSL_OP_NO_TLSv1_3;
    case "TLS 1.2":
      return constants.SSL_OP_NO_TLSv1_3;
    case "TLS 1.3":
      // No options needed - TLS 1.3 is the default
      return undefined;
    default:
      return undefined;
  }
}

function versionToProtocolString(version: string): string | null {
  const mapping: Record<string, string> = {
    "SSL 3.0": "SSLv3",
    "TLS 1.0": "TLSv1",
    "TLS 1.1": "TLSv1.1",
    "TLS 1.2": "TLSv1.2",
    "TLS 1.3": "TLSv1.3",
  };
  return mapping[version] || null;
}
