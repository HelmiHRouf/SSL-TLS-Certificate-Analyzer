"use client";

import { SearchBar } from "@/components/landing/SearchBar";
import { ExamplePills } from "@/components/landing/ExamplePills";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4">
      {/* Badge */}
      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-brand text-white hover:bg-brand/80 mb-6">
        SSL / TLS Certificate Analyzer
      </div>

      {/* Headline */}
      <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 max-w-2xl">
        Is your site&apos;s certificate actually secure?
      </h1>
      <p className="mt-4 text-center text-gray-600 max-w-xl">
        Inspect any domain&apos;s cert chain, cipher suites, and vulnerability exposure in seconds.
      </p>

      {/* Search Bar */}
      <div className="w-full max-w-lg mt-8">
        <SearchBar />
      </div>

      {/* Example Pills */}
      <div className="mt-6">
        <ExamplePills />
      </div>
    </div>
  );
}
