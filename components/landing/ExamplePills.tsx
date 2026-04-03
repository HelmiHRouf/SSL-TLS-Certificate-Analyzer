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
      <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">Try:</span>
      {EXAMPLES.map((example) => (
        <button
          key={example.domain}
          onClick={() => router.push(`/result/${encodeURIComponent(example.domain)}`)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-mono transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
        >
          {example.label}
        </button>
      ))}
    </div>
  );
}
