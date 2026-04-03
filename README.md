# CertLens — SSL/TLS Certificate Analyzer

A web tool that analyzes any domain's TLS configuration — certificate chain, protocol support, cipher suites, vulnerability exposure, and HTTP security headers — with a built-in cybersecurity learning platform that explains every finding in plain English.

## Why This Exists

Most certificate checkers give you raw data and expect you to know what it means. CertLens bridges the gap: every finding links to a clear explanation of **why it matters** and **how to fix it**. Whether you're a developer checking your own site or a student learning about TLS, this tool meets you where you are.

## What It Does

- **Certificate chain inspection** — Full chain from root CA to leaf, with SANs, key type, signature algorithm, and trust validation
- **Protocol analysis** — Checks TLS 1.3, 1.2, 1.1, 1.0, and SSL 3.0 support with risk ratings
- **Cipher suite breakdown** — Lists all supported ciphers, color-coded by strength (strong / acceptable / weak / insecure)
- **Vulnerability scanning** — Tests for Heartbleed, POODLE, BEAST, ROBOT, DROWN, FREAK, and Logjam
- **Security header audit** — Checks HSTS, CSP, X-Frame-Options, and other defense-in-depth headers
- **Expiry countdown** — Visual countdown ring showing days until certificate expiration
- **Automatic grading** — A+ through F grade based on the full analysis
- **Shareable results** — Every scan gets a unique permalink you can send to teammates
- **Learning platform** — MDX-powered topic pages explaining each vulnerability and security concept

## How It Works

```
  User enters domain
         │
         ▼
  ┌─────────────┐
  │  Zod input  │  Strip protocol, validate hostname, reject private IPs
  │  validation │
  └──────┬──────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│  TLS   │ │  HTTP    │   Run in parallel — both complete in < 2s
│connect()│ │  HEAD    │
│cert    │ │  request │
│chain   │ │  headers │
└───┬────┘ └────┬─────┘
    │           │
    └─────┬─────┘
          ▼
  ┌──────────────┐
  │   Grading    │  Start at A+, apply deductions based on findings
  │   engine     │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  SSL Labs    │  Fires async — frontend polls every 5s
  │  deep scan   │  Grade badge updates in-place when ready
  └──────┬───────┘
         │
         ▼
  Results page with grade, chain, protocols,
  ciphers, vulns, headers, and expiry countdown
```

The initial cert chain and header checks return in under 3 seconds. The SSL Labs deep scan (cipher suites, vulnerability tests) runs asynchronously and streams results to the page as they arrive — this avoids Vercel's 10-second function timeout on cold SSL Labs scans that can take 60–90 seconds.

## Tech Stack

- **Framework** — Next.js 14 (App Router), TypeScript
- **Styling** — Tailwind CSS, shadcn/ui
- **Data fetching** — TanStack Query
- **Database** — Neon (serverless Postgres) with Drizzle ORM
- **Caching** — Vercel KV (Redis)
- **Cert extraction** — Node.js `tls` module (zero dependencies)
- **Deep scan** — SSL Labs API (optional)
- **Validation** — Zod
- **Animations** — Framer Motion
- **Deployment** — Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
git clone https://github.com/HelmiHRouf/SSL-TLS-Certificate-Analyzer.git
cd SSL-TLS-Certificate-Analyzer
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# Neon Postgres
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=

# Vercel KV
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=

# SSL Labs (optional — enables deep cipher/vuln scan)
SSLLABS_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── page.tsx                → Landing page (domain search)
├── result/[domain]/        → Results dashboard
├── r/[shareId]/            → Shared permalink (SSR)
├── learn/                  → Learning hub + topic pages
└── api/
    ├── analyze/            → POST: orchestrates full scan
    ├── cert/               → GET: raw cert chain via tls.connect()
    ├── headers/            → GET: HTTP security header check
    └── grade/              → GET: SSL Labs deep scan (async)
lib/
├── tls.ts                  → TLS cert extraction
├── headers.ts              → Security header analysis
├── ssllabs.ts              → SSL Labs API client
├── grader.ts               → A+ → F grading algorithm
├── cache.ts                → Vercel KV helpers
├── db.ts                   → Neon Postgres client
└── schema.ts               → Drizzle schema
content/learn/              → MDX files for each security topic
types/cert.ts               → Shared TypeScript types
```

## License

MIT — see [LICENSE](LICENSE) for details.
