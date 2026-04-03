"use client";

import { useState } from "react";
import type { CipherSuite } from "@/types/cert";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

interface CipherSuitesProps {
  cipherSuites: CipherSuite[];
}

export function CipherSuites({ cipherSuites }: CipherSuitesProps) {
  const [isOpen, setIsOpen] = useState(
    () => cipherSuites.some((c) => c.strength === "weak" || c.strength === "insecure"),
  );

  if (cipherSuites.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-purple-600"></div>
          <h2 className="text-sm font-semibold text-gray-900">Cipher suite breakdown</h2>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
            Pending
          </span>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
          <Info className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">
              Cipher suite analysis is performed asynchronously and may take up to 60 seconds.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Deep scan via SSL Labs is running in the background...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStrengthStyle = (strength: CipherSuite["strength"]) => {
    switch (strength) {
      case "strong":
        return "bg-grade-a-bg text-grade-a-text";
      case "acceptable":
        return "bg-gray-100 text-gray-700";
      case "weak":
        return "bg-grade-b-bg text-grade-b-text";
      case "insecure":
        return "bg-grade-cf-bg text-grade-cf-text";
    }
  };

  const hasWeakOrInsecure = cipherSuites.some(
    (c) => c.strength === "weak" || c.strength === "insecure",
  );

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-600"></div>
          <h2 className="text-sm font-semibold text-gray-900">Cipher suite breakdown</h2>
          {hasWeakOrInsecure && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
              1 weak cipher detected
            </span>
          )}
        </div>
        {isOpen ? (
          <span className="text-sm text-gray-600 inline-flex items-center gap-1">
            Hide <ChevronUp className="h-4 w-4" />
          </span>
        ) : (
          <span className="text-sm text-gray-600 inline-flex items-center gap-1">
            Show <ChevronDown className="h-4 w-4" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="border-t px-5 pb-4 overflow-x-auto">
          <p className="text-xs text-gray-500 my-3">
            Negotiated: <span className="font-mono text-gray-700">TLS_AES_128_GCM_SHA256</span>{" "}
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
              Strong
            </span>
          </p>
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-xs font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left py-2 text-xs font-medium text-gray-500">
             Key ex.
                </th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">
                  Auth
                </th>
                <th className="text-left py-2 text-xs font-medium text-gray-500">
                  Encryption
                </th>
                <th className="text-left py-2 text-xs font-medium text-gray-500">
                  Strength
                </th>
              </tr>
            </thead>
            <tbody>
              {cipherSuites.map((cipher, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-2 text-sm font-mono text-gray-700">
                    {cipher.name}
                  </td>
                  <td className="py-2 text-sm text-gray-600">{cipher.kex}</td>
                  <td className="py-2 text-sm text-gray-600">{cipher.auth}</td>
                  <td className="py-2 text-sm text-gray-600">{cipher.enc}</td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStrengthStyle(
                        cipher.strength
                      )}`}
                    >
                      {cipher.strength}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasWeakOrInsecure && (
            <p className="text-xs text-gray-500 mt-3">
              1 weak cipher detected — consider disabling ECDHE-RSA-AES256-SHA.{" "}
              <a href="/learn/cipher-suites" className="text-learn hover:underline">
                Learn about cipher suites →
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}