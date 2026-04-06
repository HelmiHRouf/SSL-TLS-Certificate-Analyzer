import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scans } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";

/**
 * GET /api/scans/recent
 * Returns the 5 most recent scans from the database
 * Excludes duplicate domains (only latest scan per domain)
 */
export async function GET() {
  try {
    // Get recent scans, deduplicated by domain
    // Using DISTINCT ON for Postgres to get only the latest scan per domain
    const recentScans = await db.execute(sql`
      SELECT DISTINCT ON (domain) 
        domain, 
        grade, 
        scanned_at as "scannedAt"
      FROM scans
      ORDER BY domain, scanned_at DESC
      LIMIT 5
    `);

    // Format time ago
    const formatted = recentScans.rows.map((scan: { domain: string; grade: string; scannedAt: Date }) => ({
      domain: scan.domain,
      grade: scan.grade,
      timeAgo: formatTimeAgo(new Date(scan.scannedAt)),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Failed to fetch recent scans:", err);
    return NextResponse.json(
      { error: "Failed to fetch recent scans" },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}
