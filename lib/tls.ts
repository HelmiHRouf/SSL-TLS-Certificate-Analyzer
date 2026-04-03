import tls from "tls";
import dns from "dns/promises";
import type { ChainEntry } from "@/types/cert";

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
  try {
    const { address } = await dns.lookup(domain);
    if (isPrivateIP(address)) {
      throw new Error(
        `Cannot scan private IP addresses (${address}). Please provide a public domain.`,
      );
    }
  } catch (err) {
    // If DNS lookup fails for reasons other than private IP, still proceed
    // The TLS connection will fail if the domain is truly invalid
    if (err instanceof Error && err.message.includes("private IP")) {
      throw err;
    }
  }

  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        // Request full certificate chain
        rejectUnauthorized: false, // We want to analyze even invalid/expired certs
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

    // 8 second timeout per spec
    socket.setTimeout(8000, () => {
      socket.destroy();
      reject(new Error("Connection timeout after 8 seconds"));
    });

    socket.on("error", (err) => {
      reject(err);
    });
  });
}

function parseCertChain(cert: tls.PeerCertificate): ChainEntry[] {
  const chain: ChainEntry[] = [];

  // Build chain from leaf to root
  let current: tls.PeerCertificate | undefined = cert;
  while (current) {
    const entry = parseCertEntry(current, chain.length);
    chain.push(entry);

    // Next cert in chain (if available)
    // @ts-ignore - issuerCertificate exists at runtime but not in types
    const nextCert: tls.PeerCertificate | undefined = current.issuerCertificate;

    // Prevent infinite loops (self-signed root)
    if (nextCert && nextCert.fingerprint === cert.fingerprint) {
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
  };
}