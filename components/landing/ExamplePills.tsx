"use client";

import { useRouter } from "next/navigation";

const EXAMPLES = [
  { domain: "github.com", label: "github.com" },
  { domain: "expired.badssl.com", label: "expired.badssl.com" },
  { domain: "stripe.com", label: "stripe.com" },
];

export function ExamplePills() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-gray-500">Try:</span>
      {EXAMPLES.map((example) => (
        <button
          key={example.domain}
          onClick={() => router.push(`/result/${encodeURIComponent(example.domain)}`)}
          className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-gray-100 border-gray-200 text-gray-600"
        >
          {example.label}
        </button>
      ))}
    </div>
  );
}
