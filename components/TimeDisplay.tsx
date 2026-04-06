"use client";

import { useState, useEffect } from "react";

interface TimeDisplayProps {
  date: string; // ISO string from server
  className?: string;
}

/**
 * Client-side time display that renders in the user's local timezone
 */
export function TimeDisplay({ date, className = "" }: TimeDisplayProps) {
  const d = new Date(date);
  
  const formatted = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  }).format(d);

  return <span className={className}>{formatted}</span>;
}

/**
 * Relative time display (e.g., "2 hours ago")
 */
export function RelativeTime({ date, className = "" }: TimeDisplayProps) {
  const [relative, setRelative] = useState<string>("");
  
  useEffect(() => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) setRelative("just now");
    else if (diffMin < 60) setRelative(`${diffMin} min ago`);
    else if (diffHour < 24) setRelative(`${diffHour} hour${diffHour === 1 ? "" : "s"} ago`);
    else if (diffDay < 7) setRelative(`${diffDay} day${diffDay === 1 ? "" : "s"} ago`);
    else setRelative(d.toLocaleDateString());
  }, [date]);

  return <span className={className}>{relative}</span>;
}
