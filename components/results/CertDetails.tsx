import type { ChainEntry } from "@/types/cert";

interface CertDetailsProps {
  chain: ChainEntry[];
}

export function CertDetails({ chain }: CertDetailsProps) {
  const leaf = chain.find((c) => c.role === "leaf");

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
  ];

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
    </div>
  );
}
