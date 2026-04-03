"use client";

import { SearchBar } from "@/components/landing/SearchBar";
import { ExamplePills } from "@/components/landing/ExamplePills";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { RecentLookups, LearnBanner } from "@/components/landing/RecentLookups";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4 sm:px-6 bg-background">
      <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium mb-6 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            SSL / TLS certificate analyzer
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            Is your site&apos;s certificate actually secure?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Inspect any domain&apos;s certificate chain, cipher suites, protocol support, and known vulnerability exposure — in seconds.
          </p>

          {/* Search Bar */}
          <div className="mt-8">
            <SearchBar />
          </div>

          {/* Example Pills */}
          <div className="mt-4">
            <ExamplePills />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mb-10">
          <FeatureCards />
        </div>

        {/* Learn Banner */}
        <div className="mb-8">
          <LearnBanner />
        </div>

        {/* Recent Lookups */}
        <div>
          <RecentLookups />
        </div>
      </div>
    </div>
  );
}
