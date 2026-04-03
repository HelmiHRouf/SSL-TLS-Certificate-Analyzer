import type { ScanResult } from "@/types/cert";
import { GradeBadge } from "./GradeBadge";
import { getGradeReason } from "@/lib/grader";

interface HeroBandProps {
  result: ScanResult;
}

export function HeroBand({ result }: HeroBandProps) {
  const leaf = result.chain.find((c) => c.role === "leaf");
  const keyType = leaf?.keyType !== "Unknown" ? leaf?.keyType : null;
  const signatureAlg =
    leaf?.signatureAlg !== "Unknown" ? leaf?.signatureAlg : null;

  // Get protocol info
  const tls13 = result.protocols.find((p) => p.version === "TLS 1.3")?.supported;
  const tls12 = result.protocols.find((p) => p.version === "TLS 1.2")?.supported;

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <GradeBadge grade={result.grade} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">
            {result.domain}
          </h1>
          <p className="text-gray-600 mt-1">
            {getGradeReason(result.grade, result)}
          </p>

          {/* Pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {tls13 && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-grade-a-bg text-grade-a-text border-grade-a-text/20">
                TLS 1.3
              </span>
            )}
            {!tls13 && tls12 && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-grade-b-bg text-grade-b-text border-grade-b-text/20">
                TLS 1.2
              </span>
            )}
            {keyType && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 border-gray-200">
                {keyType}
              </span>
            )}
            {signatureAlg && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 border-gray-200">
                {signatureAlg}
              </span>
            )}
            {leaf && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  leaf.daysRemaining < 30
                    ? "bg-grade-cf-bg text-grade-cf-text border-grade-cf-text/20"
                    : leaf.daysRemaining < 60
                      ? "bg-grade-b-bg text-grade-b-text border-grade-b-text/20"
                      : "bg-grade-a-bg text-grade-a-text border-grade-a-text/20"
                }`}
              >
                {leaf.daysRemaining} days
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}