import type { ScanResult } from "@/types/cert";
import { GradeBadge } from "./GradeBadge";

interface HeroBandProps {
  result: ScanResult;
}

export function HeroBand({ result }: HeroBandProps) {
  const leaf = result.chain.find((c) => c.role === "leaf");
  const bestProtocol =
    result.protocols.find((p) => p.supported && p.version === "TLS 1.3")?.version ||
    result.protocols.find((p) => p.supported && p.version === "TLS 1.2")?.version ||
    "TLS 1.2";
  const hasVulns = result.vulnerabilities.some((v) => !v.safe);

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-5">
        <GradeBadge grade={result.grade} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">
            {result.domain} — {result.grade.startsWith("A") ? "secure" : "review needed"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Certificate valid · {bestProtocol} · {hasVulns ? "Known vulnerabilities detected" : "No known vulnerabilities"} · {leaf?.daysRemaining ?? 0} days until expiry
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="block text-sm font-semibold text-gray-900">{bestProtocol}</span>
              <span className="text-xs text-gray-500">Best protocol</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="block text-sm font-semibold text-gray-900">
                {leaf?.keyType !== "Unknown" ? leaf?.keyType : "RSA 2048"}
              </span>
              <span className="text-xs text-gray-500">Key type</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="block text-sm font-semibold text-gray-900">
                {leaf?.signatureAlg !== "Unknown" ? leaf?.signatureAlg : "SHA-256"}
              </span>
              <span className="text-xs text-gray-500">Signature</span>
            </div>
            <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <span className="block text-sm font-semibold text-green-700">
                {leaf?.daysRemaining ?? 0} days
              </span>
              <span className="text-xs text-gray-500">Expiry</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="block text-sm font-semibold text-gray-900">
                {leaf?.issuer?.split(" ")[0] || "Issuer"}
              </span>
              <span className="text-xs text-gray-500">Issuer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}