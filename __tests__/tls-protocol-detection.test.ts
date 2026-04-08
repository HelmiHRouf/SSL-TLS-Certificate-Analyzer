/**
 * Tests for detectProtocols() in lib/tls.ts
 *
 * Strategy: mock Node's `tls` and `net` built-in modules so we never touch
 * a real network. Each test configures which pinned-version connections succeed
 * (→ supported) and what the SSL 3.0 raw TCP probe receives back from the server.
 *
 * Real-world reference domains (manual smoke-testing only — configs may change):
 *   TLS 1.3 + 1.2  →  google.com, cloudflare.com
 *   TLS 1.2 only   →  tls-v1-2.badssl.com
 *   TLS 1.1 / 1.0  →  tls-v1-1.badssl.com / tls-v1-0.badssl.com
 *                      NOTE: these cannot be probed from Node.js 18+/OpenSSL 3.x
 *                      (legacy sigalg blocked). Their result is always "unknown"
 *                      and filled in later by SSL Labs deep-scan data.
 *   SSL 3.0        →  no public server still accepts it; rely on mocks
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

// ─── vi.hoisted ensures these exist before the hoisted vi.mock() calls run ───
const { mockTlsConnect, mockNetConnect } = vi.hoisted(() => ({
  mockTlsConnect: vi.fn(),
  mockNetConnect: vi.fn(),
}));

// Mock the Node built-ins. `import tls from "tls"` gets the default export,
// so we replace `default.connect`.
vi.mock("tls", () => ({ default: { connect: mockTlsConnect } }));
vi.mock("net", () => ({ default: { connect: mockNetConnect } }));

// Import after mocks are registered so the module picks up the mocked versions.
import { detectProtocols } from "../lib/tls";

// ─── Socket factory helpers ───────────────────────────────────────────────────

type MockSocket = EventEmitter & { destroy: ReturnType<typeof vi.fn>; write?: ReturnType<typeof vi.fn> };

/** Fake TLS socket whose connect callback fires immediately (handshake success). */
function tlsSuccessSocket(connectCb: () => void): MockSocket {
  const s = new EventEmitter() as MockSocket;
  s.destroy = vi.fn();
  setImmediate(connectCb);
  return s;
}

/** Fake TLS socket that emits "error" immediately (handshake rejected). */
function tlsErrorSocket(): MockSocket {
  const s = new EventEmitter() as MockSocket;
  s.destroy = vi.fn();
  setImmediate(() => s.emit("error", new Error("handshake failed")));
  return s;
}

/** Fake TLS socket that emits "timeout" immediately. */
function tlsTimeoutSocket(): MockSocket {
  const s = new EventEmitter() as MockSocket;
  s.destroy = vi.fn();
  setImmediate(() => s.emit("timeout"));
  return s;
}

/**
 * Fake net socket for the SSL 3.0 raw probe.
 * After write(), it emits data with the given first byte (or closes with no data).
 *   0x16 → ServerHello  → SSL 3.0 supported
 *   0x15 → Alert        → rejected
 *   null → connection closed with no data
 */
function netSocket(responseFirstByte: number | null, connectCb: () => void): MockSocket {
  const s = new EventEmitter() as MockSocket;
  s.destroy = vi.fn();
  s.write = vi.fn(() => {
    if (responseFirstByte !== null) {
      setImmediate(() => s.emit("data", Buffer.from([responseFirstByte])));
    } else {
      setImmediate(() => s.emit("close"));
    }
  });
  setImmediate(connectCb); // simulate TCP connection established
  return s;
}

// ─── Mock configuration helpers ───────────────────────────────────────────────

/**
 * Wire up mockTlsConnect so that connections with minVersion in `supported`
 * succeed, and all others error out.
 */
function setupTls(supported: string[]) {
  mockTlsConnect.mockImplementation(
    (opts: { minVersion?: string }, cb?: () => void) => {
      if (supported.includes(opts.minVersion ?? "")) {
        return tlsSuccessSocket(cb ?? (() => {}));
      }
      return tlsErrorSocket();
    }
  );
}

/** Wire up mockNetConnect for the SSL 3.0 raw TCP probe. */
function setupNet(responseFirstByte: number | null) {
  mockNetConnect.mockImplementation((_opts: unknown, cb?: () => void) =>
    netSocket(responseFirstByte, cb ?? (() => {}))
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("detectProtocols", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("modern server: TLS 1.3 and 1.2 detected, legacy marked unknown", async () => {
    setupTls(["TLSv1.3", "TLSv1.2"]);
    setupNet(0x15); // SSL 3.0 alert

    expect(await detectProtocols("example.com")).toEqual([
      { version: "TLS 1.3", supported: true,  detectionStatus: "detected", risk: "none" },
      { version: "TLS 1.2", supported: true,  detectionStatus: "detected", risk: "none" },
      { version: "TLS 1.1", supported: false, detectionStatus: "unknown",  risk: "low"  },
      { version: "TLS 1.0", supported: false, detectionStatus: "unknown",  risk: "high" },
      { version: "SSL 3.0", supported: false, detectionStatus: "detected", risk: "high" },
    ]);
  });

  it("TLS 1.2-only server (no 1.3)", async () => {
    setupTls(["TLSv1.2"]);
    setupNet(0x15);

    expect(await detectProtocols("example.com")).toEqual([
      { version: "TLS 1.3", supported: false, detectionStatus: "detected", risk: "none" },
      { version: "TLS 1.2", supported: true,  detectionStatus: "detected", risk: "none" },
      { version: "TLS 1.1", supported: false, detectionStatus: "unknown",  risk: "low"  },
      { version: "TLS 1.0", supported: false, detectionStatus: "unknown",  risk: "high" },
      { version: "SSL 3.0", supported: false, detectionStatus: "detected", risk: "high" },
    ]);
  });

  it("TLS 1.1 and 1.0 are always marked unknown (OpenSSL 3.x limitation)", async () => {
    // Even if we configure "success" for TLSv1.1/TLSv1, detectProtocols
    // no longer calls testProtocolVersion for those — they are unconditionally unknown.
    setupTls(["TLSv1.3", "TLSv1.2", "TLSv1.1", "TLSv1"]);
    setupNet(0x15);

    const result = await detectProtocols("example.com");
    expect(result.find((p) => p.version === "TLS 1.1")).toMatchObject({ detectionStatus: "unknown" });
    expect(result.find((p) => p.version === "TLS 1.0")).toMatchObject({ detectionStatus: "unknown" });
  });

  it("SSL 3.0 probe: server sends Alert (0x15) → not supported", async () => {
    setupTls([]);
    setupNet(0x15);

    const result = await detectProtocols("example.com");
    expect(result.find((p) => p.version === "SSL 3.0")).toMatchObject({
      supported: false,
      detectionStatus: "detected",
    });
  });

  it("SSL 3.0 probe: server sends ServerHello (0x16) → supported", async () => {
    setupTls([]);
    setupNet(0x16);

    const result = await detectProtocols("example.com");
    expect(result.find((p) => p.version === "SSL 3.0")).toMatchObject({
      supported: true,
      detectionStatus: "detected",
    });
  });

  it("SSL 3.0 probe: server closes with no data → not supported", async () => {
    setupTls([]);
    setupNet(null);

    const result = await detectProtocols("example.com");
    expect(result.find((p) => p.version === "SSL 3.0")!.supported).toBe(false);
  });

  it("TLS connection timeout → reported as not supported", async () => {
    mockTlsConnect.mockImplementation(() => tlsTimeoutSocket());
    setupNet(0x15);

    const result = await detectProtocols("slow.example.com");
    expect(result.find((p) => p.version === "TLS 1.3")!.supported).toBe(false);
    expect(result.find((p) => p.version === "TLS 1.2")!.supported).toBe(false);
  });

  it("all detectable versions rejected → all false / unknown", async () => {
    setupTls([]);
    setupNet(0x15);

    const result = await detectProtocols("broken.example.com");
    expect(result.find((p) => p.version === "TLS 1.3")!.supported).toBe(false);
    expect(result.find((p) => p.version === "TLS 1.2")!.supported).toBe(false);
    expect(result.find((p) => p.version === "SSL 3.0")!.supported).toBe(false);
  });

  it("returns exactly 5 entries in correct order", async () => {
    setupTls(["TLSv1.3", "TLSv1.2"]);
    setupNet(0x15);

    const result = await detectProtocols("example.com");
    expect(result.map((p) => p.version)).toEqual([
      "TLS 1.3", "TLS 1.2", "TLS 1.1", "TLS 1.0", "SSL 3.0",
    ]);
  });

  it("risk levels are always correct", async () => {
    setupTls([]);
    setupNet(0x15);

    const result = await detectProtocols("example.com");
    expect(result.find((p) => p.version === "TLS 1.3")!.risk).toBe("none");
    expect(result.find((p) => p.version === "TLS 1.2")!.risk).toBe("none");
    expect(result.find((p) => p.version === "TLS 1.1")!.risk).toBe("low");
    expect(result.find((p) => p.version === "TLS 1.0")!.risk).toBe("high");
    expect(result.find((p) => p.version === "SSL 3.0")!.risk).toBe("high");
  });
});
