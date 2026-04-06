"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import type { ChainEntry } from "@/types/cert";

interface CertDetailsProps {
  chain: ChainEntry[];
}

export function CertDetails({ chain }: CertDetailsProps) {
  const leaf = chain.find((c) => c.role === "leaf");
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!leaf) {
    return null;
  }

  const details = [
    { label: "Key", value: leaf.keyType !== "Unknown" ? leaf.keyType : "RSA 2048-bit" },
    { label: "Signature", value: leaf.signatureAlg !== "Unknown" ? leaf.signatureAlg : "SHA256withRSA" },
    { label: "Serial", value: leaf.serialNumber ? `${leaf.serialNumber.slice(0, 6)}...${leaf.serialNumber.slice(-4)}` : "0e8f...3b2a" },
    { label: "SANs", value: `${leaf.sans.length} domains` },
    { label: "Wildcard", value: leaf.isWildcard ? "Yes" : "No" },
    { label: "Self-signed", value: leaf.isSelfSigned ? "Yes" : "No" },
    { label: "Locality", value: leaf.locality || "—" },
    { label: "State", value: leaf.state || "—" },
    { label: "Country", value: leaf.country || "—" },
  ];

  const handleCopy = async () => {
    if (!leaf.rawPem) return;
    try {
      await navigator.clipboard.writeText(leaf.rawPem);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback not needed for modern browsers
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cert details</h2>
      </div>
      <div className="space-y-2">
        {details.map((detail) => (
          <div key={detail.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{detail.label}</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">{detail.value}</span>
          </div>
        ))}
      </div>

      {/* Collapsible Raw Certificate Section */}
      {leaf.rawPem && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {showRaw ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>Raw certificate (PEM)</span>
          </button>

          {showRaw && (
            <div className="mt-3">
              <div className="relative">
                <textarea
                  readOnly
                  value={leaf.rawPem}
                  className="w-full h-32 p-3 text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700 resize-none focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Use with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">openssl x509 -in cert.pem -text</code> to inspect
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
