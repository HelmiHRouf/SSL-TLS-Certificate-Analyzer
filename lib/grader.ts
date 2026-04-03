import type { Grade, ScanResult, CertInfo } from "@/types/cert";

/**
 * Compute grade based on cert chain, protocols, and cipher suites.
 * Start at A+, apply deductions in order. First rule that caps grade wins.
 */
export function computeGrade(result: Partial<ScanResult>): Grade {
  const { chain, protocols, cipherSuites, vulnerabilities } = result;

  const leaf = chain?.find((c) => c.role === "leaf");

  // F-grade conditions (hard fails)
  if (leaf?.isExpired) return "F";
  if (leaf?.isSelfSigned) return "F";
  if (
    vulnerabilities?.some(
      (v) => !v.safe && ["heartbleed", "robot"].includes(v.slug),
    )
  ) {
    return "F";
  }

  // Protocol deductions
  if (protocols?.some((p) => p.version === "SSL 3.0" && p.supported)) {
    return "C";
  }
  if (protocols?.some((p) => p.version === "TLS 1.0" && p.supported)) {
    return "B";
  }
  if (protocols?.some((p) => p.version === "TLS 1.1" && p.supported)) {
    return "B";
  }

  // Cipher suite deductions
  if (cipherSuites?.some((c) => c.strength === "insecure")) {
    return "C";
  }
  if (cipherSuites?.some((c) => c.strength === "weak")) {
    return "B";
  }

  // Expiry approaching (less than 30 days)
  if ((leaf?.daysRemaining ?? 999) < 30) {
    return "B";
  }

  // Check for TLS 1.3 support for A+ vs A
  const hasTLS13 = protocols?.some(
    (p) => p.version === "TLS 1.3" && p.supported,
  );

  return hasTLS13 ? "A+" : "A";
}

/**
 * Get a human-readable description of why a grade was assigned.
 * Useful for displaying to users in the UI.
 */
export function getGradeReason(grade: Grade, result: Partial<ScanResult>): string {
  const { chain, protocols, cipherSuites, vulnerabilities } = result;
  const leaf = chain?.find((c) => c.role === "leaf");

  if (leaf?.isExpired) {
    return "Certificate has expired. Renew immediately.";
  }
  if (leaf?.isSelfSigned) {
    return "Self-signed certificates are not trusted by browsers. Use a proper CA.";
  }
  if (
    vulnerabilities?.some(
      (v) => !v.safe && ["heartbleed", "robot"].includes(v.slug),
    )
  ) {
    return "Critical vulnerability detected. Server is at immediate risk.";
  }
  if (protocols?.some((p) => p.version === "SSL 3.0" && p.supported)) {
    return "SSL 3.0 is enabled — vulnerable to POODLE attack. Disable immediately.";
  }
  if (
    protocols?.some(
      (p) =>
        (p.version === "TLS 1.0" || p.version === "TLS 1.1") && p.supported,
    )
  ) {
    return "Legacy TLS versions enabled. Disable TLS 1.0 and 1.1 to improve security.";
  }
  if (cipherSuites?.some((c) => c.strength === "insecure")) {
    return "Insecure cipher suites supported. Remove these weak ciphers.";
  }
  if (cipherSuites?.some((c) => c.strength === "weak")) {
    return "Weak cipher suites detected. Consider using only strong ciphers.";
  }
  if ((leaf?.daysRemaining ?? 999) < 30) {
    return `Certificate expires in ${leaf?.daysRemaining} days. Plan renewal soon.`;
  }

  if (grade === "A+") {
    return "Excellent! TLS 1.3 enabled with strong configuration.";
  }
  return "Good configuration. Enable TLS 1.3 for best security.";
}

/**
 * Get color classes for a grade (for UI rendering).
 * Matches spec's color palette.
 */
export function getGradeColorClasses(grade: Grade): {
  bg: string;
  text: string;
  border?: string;
} {
  switch (grade) {
    case "A+":
    case "A":
      return { bg: "bg-grade-a-bg", text: "text-grade-a-text dark:text-grade-a-text-dark" };
    case "B":
      return { bg: "bg-grade-b-bg", text: "text-grade-b-text dark:text-grade-b-text-dark" };
    case "C":
    case "F":
      return { bg: "bg-grade-cf-bg", text: "text-grade-cf-text dark:text-grade-cf-text-dark" };
    default:
      return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" };
  }
}
