import { useState } from "react";
import type { ChainEntry } from "@/types/cert";
import { ChevronDown, ChevronUp, Shield, FileBadge } from "lucide-react";

interface CertChainProps {
  chain: ChainEntry[];
}

export function CertChain({ chain }: CertChainProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (chain.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Certificate Chain</h2>
        <p className="text-gray-500">No certificate data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Certificate Chain</h2>
      <div className="space-y-3">
        {chain.map((cert, index) => (
          <div
            key={index}
            className={`border rounded-lg overflow-hidden ${
              cert.role === "leaf"
                ? "border-brand/30 bg-brand/5"
                : "border-gray-200"
            }`}
          >
            <button
              onClick={() => setExpanded(expanded === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {cert.role === "root" ? (
                  <Shield className="h-5 w-5 text-grade-a-text flex-shrink-0" />
                ) : cert.role === "leaf" ? (
                  <FileBadge className="h-5 w-5 text-brand flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {cert.subject}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{cert.role}</p>
                </div>
              </div>
              {expanded === index ? (
                <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {expanded === index && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
                  <div>
                    <dt className="text-gray-500">Issuer</dt>
                    <dd className="font-medium text-gray-900">{cert.issuer}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Serial Number</dt>
                    <dd className="font-mono text-xs text-gray-700">
                      {cert.serialNumber || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Valid From</dt>
                    <dd className="text-gray-700">
                      {cert.validFrom
                        ? new Date(cert.validFrom).toLocaleDateString()
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Valid To</dt>
                    <dd className="text-gray-700">
                      {cert.validTo
                        ? new Date(cert.validTo).toLocaleDateString()
                        : "N/A"}
                    </dd>
                  </div>
                  {cert.sans.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500">Subject Alt Names</dt>
                      <dd className="flex flex-wrap gap-1 mt-1">
                        {cert.sans.map((san, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-700"
                          >
                            {san}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}