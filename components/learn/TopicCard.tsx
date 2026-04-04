"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface TopicCardProps {
  title: string;
  slug: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: string;
}

const difficultyStyles = {
  Beginner:
    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  Intermediate:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
  Advanced:
    "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

// Icon mapping based on the screenshot
const iconMap: Record<string, string> = {
  POODLE: "⊕",
  Heartbleed: "⊕",
  BEAST: "🐻",
  ROBOT: "⊕",
  "TLS 1.3": "🔒",
  "Certificate chain": "←",
  "Perfect forward secrecy": "🔐",
  "Cipher suites": "⊕",
  HSTS: "🌐",
  "Content Security Policy": "🎨",
};

// Icon color mapping
const iconColorMap: Record<string, string> = {
  POODLE: "text-red-600 dark:text-red-400",
  Heartbleed: "text-red-600 dark:text-red-400",
  BEAST: "text-amber-600 dark:text-amber-400",
  ROBOT: "text-amber-600 dark:text-amber-400",
  "TLS 1.3": "text-teal-600 dark:text-teal-400",
  "Certificate chain": "text-blue-600 dark:text-blue-400",
  "Perfect forward secrecy": "text-green-600 dark:text-green-400",
  "Cipher suites": "text-blue-600 dark:text-blue-400",
  HSTS: "text-indigo-600 dark:text-indigo-400",
  "Content Security Policy": "text-purple-600 dark:text-purple-400",
};

export function TopicCard({
  title,
  slug,
  description,
  difficulty,
  icon,
}: TopicCardProps) {
  const iconSymbol = iconMap[title] || icon;
  const iconColor = iconColorMap[title] || "text-gray-600 dark:text-gray-400";

  return (
    <Link
      href={`/learn/${slug}`}
      className="group block rounded-xl border border-border bg-card p-5 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-lg ${iconColor}`}>{iconSymbol}</span>
          <h3 className="font-semibold text-card-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyles[difficulty]}`}
          >
            {difficulty}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>
      <div className="mt-4 flex items-center justify-end">
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
      </div>
    </Link>
  );
}
