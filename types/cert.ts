export type Grade = "A+" | "A" | "B" | "C" | "F";

export interface CertInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  serialNumber: string;
  keyType: string; // e.g. "RSA 2048-bit"
  signatureAlg: string; // e.g. "SHA256withRSA"
  sans: string[];
  isWildcard: boolean;
  isSelfSigned: boolean;
  isExpired: boolean;
  rawPem?: string; // Full certificate in PEM format (for advanced users)
}

export interface ChainEntry extends CertInfo {
  role: "root" | "intermediate" | "leaf";
}

export interface ProtocolSupport {
  version: string; // "TLS 1.3", "TLS 1.2", etc.
  supported: boolean;
  risk: "none" | "low" | "high";
}

export interface CipherSuite {
  name: string;
  strength: "strong" | "acceptable" | "weak" | "insecure";
  kex: string; // key exchange, e.g. "ECDHE"
  auth: string; // authentication, e.g. "RSA"
  enc: string; // encryption, e.g. "AES-256-GCM"
  mac: string; // MAC, e.g. "SHA256"
}

export interface VulnResult {
  name: string; // "Heartbleed", "POODLE", etc.
  slug: string; // "heartbleed", used for /learn/[slug] links
  safe: boolean;
}

export interface SecurityHeader {
  name: string;
  status: "present" | "missing" | "misconfigured";
  value?: string;
}

export interface ScanResult {
  domain: string;
  grade: Grade;
  chain: ChainEntry[];
  protocols: ProtocolSupport[];
  cipherSuites: CipherSuite[];
  vulnerabilities: VulnResult[];
  headers: SecurityHeader[];
  scannedAt: string;
  shareId: string;
}
