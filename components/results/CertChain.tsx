import { useState } from "react";
import type { ChainEntry } from "@/types/cert";
import { ChevronDown, ChevronUp, Shield, FileBadge, Link2 } from "lucide-react";

interface CertChainProps {
  chain: ChainEntry[];
}

export function CertChain({ chain }: CertChainProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (chain.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4">Certificate chain</h2>
        <p className="text-gray-500 dark:text-gray-400">No certificate data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-teal-600"></div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Certificate chain</h2>
      </div>
      <div className="space-y-3">
        {chain.map((cert, index) => (
          <div
            key={index}
            className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={() => setExpanded(expanded === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    cert.role === "root"
                      ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                      : cert.role === "leaf"
                        ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400"
                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {cert.role === "root" ? (
                    <Shield className="h-4 w-4" />
                  ) : cert.role === "leaf" ? (
                    <FileBadge className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                    {cert.subject}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {cert.role === "root"
                      ? `Root · Self-signed · Expires ${cert.validTo ? new Date(cert.validTo).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Unknown"}`
                      : cert.role === "intermediate"
                        ? `Intermediate · Expires ${cert.validTo ? new Date(cert.validTo).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Unknown"}`
                        : `Leaf · SAN: ${cert.sans.slice(0, 2).join(", ")}${cert.sans.length > 2 ? "..." : ""} · Expires ${cert.validTo ? new Date(cert.validTo).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Unknown"}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    cert.role === "root"
                      ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                      : cert.role === "leaf"
                        ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400"
                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {cert.role}
                </span>
                {expanded === index ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>

            {expanded === index && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-800">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Issuer</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{cert.issuer}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Serial Number</dt>
                    <dd className="font-mono text-xs text-gray-700 dark:text-gray-300">
                      {cert.serialNumber || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Valid From</dt>
                    <dd className="text-gray-700 dark:text-gray-300">
                      {cert.validFrom
                        ? new Date(cert.validFrom).toLocaleDateString()
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Valid To</dt>
                    <dd className="text-gray-700 dark:text-gray-300">
                      {cert.validTo
                        ? new Date(cert.validTo).toLocaleDateString()
                        : "N/A"}
                    </dd>
                  </div>
                  {cert.sans.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500 dark:text-gray-400">Subject Alt Names</dt>
                      <dd className="flex flex-wrap gap-1 mt-1">
                        {cert.sans.map((san, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
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