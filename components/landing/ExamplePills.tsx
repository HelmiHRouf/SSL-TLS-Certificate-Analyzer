"use client";

import { useRouter } from "next/navigation";

const EXAMPLES = [
  { domain: "github.com", label: "github.com" },
  { domain: "expired.badssl.com", label: "expired.badssl.com" },
  { domain: "api.stripe.com", label: "api.stripe.com" },
];

export function ExamplePills() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-gray-500 font-mono">Try:</span>
      {EXAMPLES.map((example) => (
        <button
          key={example.domain}
          onClick={() => router.push(`/result/${encodeURIComponent(example.domain)}`)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-mono transition-colors hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 bg-white"
        >
          {example.label}
        </button>
      ))}
    </div>
  );
}
