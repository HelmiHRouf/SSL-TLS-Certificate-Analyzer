import { Search } from "lucide-react";
import { TopicCard } from "@/components/learn/TopicCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Topics data organized by category
const topics = {
  "Protocol Attacks": [
    {
      title: "POODLE",
      slug: "poodle",
      difficulty: "Beginner" as const,
      description: "SSL 3.0 padding oracle attack that decrypts HTTPS traffic.",
      icon: "⊕",
    },
    {
      title: "Heartbleed",
      slug: "heartbleed",
      difficulty: "Intermediate" as const,
      description: "OpenSSL buffer over-read exposing private keys and passwords.",
      icon: "⊕",
    },
    {
      title: "BEAST",
      slug: "beast",
      difficulty: "Intermediate" as const,
      description: "CBC mode block cipher attack against TLS 1.0.",
      icon: "🐻",
    },
    {
      title: "ROBOT",
      slug: "robot",
      difficulty: "Advanced" as const,
      description: "RSA decryption oracle allowing server impersonation.",
      icon: "⊕",
    },
  ],
  "TLS Fundamentals": [
    {
      title: "TLS 1.3",
      slug: "tls-13",
      difficulty: "Beginner" as const,
      description: "What changed from TLS 1.2 and why it matters for your users.",
      icon: "🔒",
    },
    {
      title: "Certificate chain",
      slug: "certificate-chain",
      difficulty: "Beginner" as const,
      description: "How root CAs, intermediates, and leaf certificates form a trust hierarchy.",
      icon: "←",
    },
    {
      title: "Perfect forward secrecy",
      slug: "perfect-forward-secrecy",
      difficulty: "Intermediate" as const,
      description: "Why ephemeral keys mean a compromised private key can't decrypt past sessions.",
      icon: "🔐",
    },
    {
      title: "Cipher suites",
      slug: "cipher-suites",
      difficulty: "Intermediate" as const,
      description: "Decoding cipher suite names: key exchange, auth, encryption, and MAC.",
      icon: "⊕",
    },
  ],
  "Header Hardening": [
    {
      title: "HSTS",
      slug: "hsts",
      difficulty: "Beginner" as const,
      description: "Force HTTPS permanently and prevent protocol downgrade attacks.",
      icon: "🌐",
    },
    {
      title: "Content Security Policy",
      slug: "csp",
      difficulty: "Advanced" as const,
      description: "Restrict what scripts, styles, and resources can load on your page.",
      icon: "🎨",
    },
  ],
};

export default function LearnHub() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium mb-6 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800">
            Cybersecurity learning hub
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Understand what you&apos;re scanning
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Plain-English explanations for every TLS concept, vulnerability, and security
            header — written for developers, not just security researchers.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Protocol Attacks */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Protocol Attacks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics["Protocol Attacks"].map((topic) => (
              <TopicCard key={topic.slug} {...topic} />
            ))}
          </div>
        </section>

        {/* TLS Fundamentals */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            TLS Fundamentals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics["TLS Fundamentals"].map((topic) => (
              <TopicCard key={topic.slug} {...topic} />
            ))}
          </div>
        </section>

        {/* Header Hardening */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Header Hardening
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics["Header Hardening"].map((topic) => (
              <TopicCard key={topic.slug} {...topic} />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-card-foreground">
                Ready to check your own site?
              </h3>
              <p className="text-sm text-muted-foreground">
                Run a free scan and see exactly which topics apply to your certificate.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 dark:bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors"
            >
              Analyze a domain
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
