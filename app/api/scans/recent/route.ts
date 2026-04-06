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
    // Get 5 most recent unique scans by domain
    // Subquery gets latest scan per domain, outer query sorts by time
    const recentScans = await db.execute(sql`
      WITH latest_scans AS (
        SELECT DISTINCT ON (domain) 
          domain, 
          grade, 
          scanned_at
        FROM scans
        ORDER BY domain, scanned_at DESC
      )
      SELECT domain, grade, scanned_at as "scannedAt"
      FROM latest_scans
      ORDER BY scanned_at DESC
      LIMIT 5
    `);

    // Handle empty results
    if (!recentScans.rows || recentScans.rows.length === 0) {
      return NextResponse.json([]);
    }

    // Format time ago
    const formatted = recentScans.rows.map((row) => {
      const scan = row as { domain: string; grade: string; scannedAt: string | Date };
      const scannedAtStr = typeof scan.scannedAt === 'string' 
        ? scan.scannedAt 
        : (scan.scannedAt as unknown as { toISOString: () => string }).toISOString?.() || String(scan.scannedAt);
      return {
        domain: scan.domain,
        grade: scan.grade,
        timeAgo: formatTimeAgo(new Date(scannedAtStr)),
      };
    });

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
