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

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A+":
    case "A":
      return "bg-grade-a-bg text-grade-a-text dark:text-grade-a-text-dark";
    case "B":
      return "bg-grade-b-bg text-grade-b-text dark:text-grade-b-text-dark";
    case "C":
    case "F":
      return "bg-grade-cf-bg text-grade-cf-text dark:text-grade-cf-text-dark";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
  }
}

export function RecentLookups() {
  const router = useRouter();
  const [lookups, setLookups] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real recent scans from the database
    async function fetchRecent() {
      try {
        const res = await fetch("/api/scans/recent");
        if (res.ok) {
          const data = await res.json();
          // Handle both array response and error response
          if (Array.isArray(data)) {
            setLookups(data);
          } else {
            console.error("Invalid response from /api/scans/recent:", data);
            setLookups([]);
          }
        } else {
          console.error("Failed to fetch recent scans:", res.status);
          setLookups([]);
        }
      } catch (err) {
        console.error("Error fetching recent scans:", err);
        setLookups([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRecent();
  }, []);

  if (lookups.length === 0 || loading) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recent lookups
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Community activity
        </span>
      </div>
      <div className="space-y-2">
        {lookups.map((lookup) => (
          <button
            key={lookup.domain}
            onClick={() => router.push(`/result/${encodeURIComponent(lookup.domain)}`)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors text-left"
          >
            <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{lookup.domain}</span>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center justify-center w-8 h-5 rounded text-xs font-semibold ${getGradeColor(
                  lookup.grade
                )}`}
              >
                {lookup.grade}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{lookup.timeAgo}</span>
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
    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">New — cybersecurity learning hub</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Understand every finding: POODLE, TLS 1.3, cipher suites, and more.
          </p>
        </div>
      </div>
      <Button
        onClick={() => router.push("/learn")}
        variant="outline"
        className="hidden sm:flex items-center gap-1 border-indigo-200 dark:border-indigo-700 hover:bg-white dark:hover:bg-gray-800"
      >
        Explore Learn
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
