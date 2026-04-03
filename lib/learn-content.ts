export const LEARN_CONTENT = {
  protocols: {
    "TLS 1.3": {
      title: "TLS 1.3",
      description:
        "The latest version of TLS with improved security and faster handshakes. Removes support for outdated algorithms and provides perfect forward secrecy by default.",
      link: "/learn/tls-13",
    },
    "TLS 1.2": {
      title: "TLS 1.2",
      description:
        "Widely supported protocol version. Secure when configured properly, but supports many cipher suites. Should be used alongside TLS 1.3 for compatibility.",
      link: "/learn/tls-versions",
    },
    "TLS 1.1": {
      title: "TLS 1.1",
      description:
        "Deprecated protocol with known vulnerabilities including BEAST. Should be disabled on all servers. Only keep for legacy compatibility if absolutely necessary.",
      link: "/learn/tls-deprecated",
    },
    "TLS 1.0": {
      title: "TLS 1.0",
      description:
        "Deprecated and insecure protocol. Vulnerable to multiple attacks including BEAST, CRIME, and POODLE. Disable immediately on all production servers.",
      link: "/learn/tls-deprecated",
    },
    "SSL 3.0": {
      title: "SSL 3.0",
      description:
        "Completely obsolete and insecure protocol. Vulnerable to POODLE attack which allows attackers to decrypt HTTPS traffic. Must be disabled on all servers.",
      link: "/learn/poodle",
    },
  },
  vulnerabilities: {
    heartbleed: {
      title: "Heartbleed",
      description:
        "Critical vulnerability in OpenSSL that allows attackers to read server memory, potentially exposing private keys and passwords. Fixed in OpenSSL 1.0.1g.",
      link: "/learn/heartbleed",
    },
    poodle: {
      title: "POODLE",
      description:
        "Padding Oracle On Downgraded Legacy Encryption. Allows attackers to decrypt SSL 3.0 traffic by manipulating padding bytes. Disable SSL 3.0 to prevent this.",
      link: "/learn/poodle",
    },
    beast: {
      title: "BEAST",
      description:
        "Browser Exploit Against SSL/TLS. Affects TLS 1.0 and allows attackers to decrypt cookies and session tokens. Mitigated by modern browsers but best to disable TLS 1.0.",
      link: "/learn/beast",
    },
    robot: {
      title: "ROBOT",
      description:
        "Return Of Bleichenbacher's Oracle Threat. Affects RSA key exchange and allows attackers to decrypt traffic or forge signatures. Upgrade to TLS 1.3 to prevent this.",
      link: "/learn/robot",
    },
    drown: {
      title: "DROWN",
      description:
        "Decrypting RSA with Obsolete and Weakened eNcryption. Allows attackers to decrypt TLS connections by exploiting SSLv2 servers sharing the same certificate.",
      link: "/learn/drown",
    },
    freak: {
      title: "FREAK",
      description:
        "Factoring RSA Export Keys. Allows attackers to downgrade connections to weak export-grade RSA keys that can be factored with modern hardware.",
      link: "/learn/freak",
    },
    logjam: {
      title: "Logjam",
      description:
        "Affects Diffie-Hellman key exchange by forcing connections to use weak 512-bit export-grade primes. Use strong DH parameters or prefer ECDHE.",
      link: "/learn/logjam",
    },
  },
  headers: {
    HSTS: {
      title: "HTTP Strict Transport Security",
      description:
        "Tells browsers to always use HTTPS for your domain, preventing downgrade attacks and cookie hijacking. Include 'includeSubDomains' and 'preload' for maximum security.",
      link: "/learn/hsts",
    },
    CSP: {
      title: "Content Security Policy",
      description:
        "Prevents XSS and data injection attacks by controlling which resources can be loaded. Avoid 'unsafe-inline' and 'unsafe-eval' directives for maximum security.",
      link: "/learn/csp",
    },
    "X-Frame-Options": {
      title: "X-Frame-Options",
      description:
        "Prevents your site from being embedded in iframes on other sites, protecting against clickjacking attacks. Use 'deny' or 'sameorigin' values.",
      link: "/learn/security-headers",
    },
    "X-XSS-Protection": {
      title: "X-XSS-Protection",
      description:
        "Legacy browser feature that detected and blocked some XSS attacks. Modern browsers no longer support this header as CSP provides better protection.",
      link: "/learn/security-headers",
    },
    "Referrer-Policy": {
      title: "Referrer Policy",
      description:
        "Controls how much referrer information is sent with requests. Use 'strict-origin-when-cross-origin' to balance privacy and functionality.",
      link: "/learn/security-headers",
    },
    "Permissions-Policy": {
      title: "Permissions Policy",
      description:
        "Allows you to selectively enable or disable browser features like camera, microphone, geolocation. Helps prevent abuse of powerful APIs.",
      link: "/learn/security-headers",
    },
  },
};
