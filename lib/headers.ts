import type { SecurityHeader } from "@/types/cert";

const SECURITY_HEADERS = [
  {
    name: "HSTS",
    header: "strict-transport-security",
    // HSTS should have includeSubDomains and ideally preload
    validate: (value: string | null): { status: SecurityHeader["status"]; value?: string } => {
      if (!value) return { status: "missing" };
      return { status: "present", value };
    },
  },
  {
    name: "X-Frame-Options",
    header: "x-frame-options",
    validate: (value: string | null): { status: SecurityHeader["status"]; value?: string } => {
      if (!value) return { status: "missing" };
      const validValues = ["deny", "sameorigin", "allow-from"];
      const lowerValue = value.toLowerCase();
      if (validValues.some((v) => lowerValue.includes(v))) {
        return { status: "present", value };
      }
      return { status: "misconfigured", value };
    },
  },
  {
    name: "CSP",
    header: "content-security-policy",
    validate: (value: string | null): { status: SecurityHeader["status"]; value?: string } => {
      return scoreCSP(value);
    },
  },
  {
    name: "X-Content-Type-Options",
    header: "x-content-type-options",
    validate: (value: string | null): { status: SecurityHeader["status"]; value?: string } => {
      if (!value) return { status: "missing" };
      if (value.toLowerCase() === "nosniff") {
        return { status: "present", value };
      }
      return { status: "misconfigured", value };
    },
  },
  {
    name: "X-XSS-Protection",
    header: "x-xss-protection",
    validate: (value: string | null): { status: SecurityHeader["status"]; value?: string } => {
      if (!value) return { status: "missing" };
      // Modern browsers ignore this header, but it's still good to have
      return { status: "present", value };
    },
  },
  {
    name: "Referrer-Policy",
    header: "referrer-policy",
    validate: (value: string | null): { status: SecurityHeader["status"]; value?: string } => {
      if (!value) return { status: "missing" };
      const validValues = [
        "no-referrer",
        "no-referrer-when-downgrade",
        "origin",
        "origin-when-cross-origin",
        "same-origin",
        "strict-origin",
        "strict-origin-when-cross-origin",
        "unsafe-url",
      ];
      if (validValues.includes(value.toLowerCase())) {
        return { status: "present", value };
      }
      return { status: "misconfigured", value };
    },
  },
  {
    name: "Permissions-Policy",
    header: "permissions-policy",
    // Also check for deprecated Feature-Policy header
    altHeader: "feature-policy",
    validate: (value: string | null, altValue?: string | null): { status: SecurityHeader["status"]; value?: string } => {
      if (value) return { status: "present", value };
      if (altValue) return { status: "present", value: altValue };
      return { status: "missing" };
    },
  },
] as const;

/**
 * Score CSP header value.
 * Returns 'present' for good CSP, 'misconfigured' if unsafe-inline/unsafe-eval present,
 * 'missing' if no CSP.
 */
function scoreCSP(value: string | null): { status: SecurityHeader["status"]; value?: string } {
  if (!value) {
    return { status: "missing" };
  }

  const lowerValue = value.toLowerCase();

  // Check for unsafe directives that weaken security
  const unsafeDirectives = ["unsafe-inline", "unsafe-eval", "unsafe-hashes"];
  const hasUnsafe = unsafeDirectives.some((directive) => lowerValue.includes(directive));

  // Check for script-src 'none' or similar hardening
  const isHardened = lowerValue.includes("script-src") && !lowerValue.includes("*");

  if (hasUnsafe) {
    return { status: "misconfigured", value };
  }

  return { status: "present", value };
}

/**
 * Fetch and analyze security headers for a domain.
 * Performs HEAD request to avoid downloading body content.
 */
export async function fetchSecurityHeaders(domain: string): Promise<SecurityHeader[]> {
  try {
    const res = await fetch(`https://${domain}`, {
      method: "HEAD",
      redirect: "follow",
    });

    const headers = res.headers;

    return SECURITY_HEADERS.map((headerDef) => {
      const value = headers.get(headerDef.header);
      const altValue = "altHeader" in headerDef && headerDef.altHeader
        ? headers.get(headerDef.altHeader)
        : null;

      const result = headerDef.validate(value, altValue);

      return {
        name: headerDef.name,
        status: result.status,
        value: result.value,
      };
    });
  } catch (err) {
    // If request fails, return all headers as missing (domain unreachable or no HTTPS)
    return SECURITY_HEADERS.map((headerDef) => ({
      name: headerDef.name,
      status: "missing" as const,
    }));
  }
}
