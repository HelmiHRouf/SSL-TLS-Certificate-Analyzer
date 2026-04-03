"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lookup {
  domain: string;
  grade: string;
  timeAgo: string;
}

// Mock data for recent lookups
const MOCK_LOOKUPS: Lookup[] = [
  { domain: "github.com", grade: "A+", timeAgo: "2 min ago" },
  { domain: "expired.badssl.com", grade: "F", timeAgo: "18 min ago" },
  { domain: "api.stripe.com", grade: "A+", timeAgo: "1 hr ago" },
  { domain: "old-bank.example.com", grade: "B", timeAgo: "3 hr ago" },
];

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A+":
    case "A":
      return "bg-grade-a-bg text-grade-a-text";
    case "B":
      return "bg-grade-b-bg text-grade-b-text";
    case "C":
    case "F":
      return "bg-grade-cf-bg text-grade-cf-text";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function RecentLookups() {
  const router = useRouter();
  const [lookups, setLookups] = useState<Lookup[]>([]);

  useEffect(() => {
    // Try to get from localStorage, fallback to mock data
    try {
      const stored = localStorage.getItem("certlens-recent-lookups");
      if (stored) {
        setLookups(JSON.parse(stored));
      } else {
        setLookups(MOCK_LOOKUPS);
      }
    } catch {
      setLookups(MOCK_LOOKUPS);
    }
  }, []);

  const clearHistory = () => {
    setLookups([]);
    try {
      localStorage.removeItem("certlens-recent-lookups");
    } catch {
      // ignore
    }
  };

  if (lookups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Recent lookups
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="h-7 text-xs text-gray-500 hover:text-gray-700"
        >
          Clear history
        </Button>
      </div>
      <div className="space-y-2">
        {lookups.map((lookup) => (
          <button
            key={lookup.domain}
            onClick={() => router.push(`/result/${encodeURIComponent(lookup.domain)}`)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors text-left"
          >
            <span className="font-mono text-sm text-gray-900">{lookup.domain}</span>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center justify-center w-8 h-5 rounded text-xs font-semibold ${getGradeColor(
                  lookup.grade
                )}`}
              >
                {lookup.grade}
              </span>
              <span className="text-xs text-gray-500">{lookup.timeAgo}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LearnBanner() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">New — cybersecurity learning hub</p>
          <p className="text-sm text-gray-600">
            Understand every finding: POODLE, TLS 1.3, cipher suites, and more.
          </p>
        </div>
      </div>
      <Button
        onClick={() => router.push("/learn")}
        variant="outline"
        className="hidden sm:flex items-center gap-1 border-indigo-200 hover:bg-white"
      >
        Explore Learn
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}