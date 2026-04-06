import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { scans } from "@/lib/schema";
import { eq, and, gt, or, isNull } from "drizzle-orm";
import type { ScanResult } from "@/types/cert";
import { TopBar } from "@/components/results/TopBar";
import { HeroBand } from "@/components/results/HeroBand";
import { CertChain } from "@/components/results/CertChain";
import { ProtocolTable } from "@/components/results/ProtocolTable";
import { SecurityHeaders } from "@/components/results/SecurityHeaders";
import { ExpiryCountdown } from "@/components/results/ExpiryCountdown";
import { VulnPanel } from "@/components/results/VulnPanel";
import { CipherSuites } from "@/components/results/CipherSuites";
import { CertDetails } from "@/components/results/CertDetails";
import { LearnMore } from "@/components/results/LearnMore";
import { TimeDisplay } from "@/components/TimeDisplay";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: {
    shareId: string;
  };
}

// Revalidate every hour to check for expired scans
export const revalidate = 3600;

export default async function SharedScanPage({ params }: PageProps) {
  const { shareId } = params;

  // Query the database for non-expired scans (null expiresAt means never expires)
  const scanRows = await db
    .select()
    .from(scans)
    .where(
      and(
        eq(scans.shareId, shareId),
        or(
          isNull(scans.expiresAt),
          gt(scans.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  if (scanRows.length === 0) {
    // Scan not found or expired — show expired page
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Scan has expired
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This scan result has expired after 30 days. Run a fresh scan to get the current security status.
          </p>
          <Link href="/">
            <Button className="bg-brand hover:bg-brand-dark text-white">
              Run a new scan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const scan = scanRows[0];
  const result = scan.result as unknown as ScanResult;
  const scannedAt = new Date(scan.scannedAt ?? new Date());

  return (
    <div className="min-h-[calc(100vh-8rem)] py-6 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Scanned on [date] banner */}
        <div className="mb-4 px-4 py-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-teal-800 dark:text-teal-200">
              <span className="font-medium">Scanned on <TimeDisplay date={scannedAt.toISOString()} /></span>
              <span className="text-teal-600 dark:text-teal-400 ml-2">
                — Run a fresh scan for current results
              </span>
            </p>
            <Link href={`/result/${encodeURIComponent(scan.domain)}`}>
              <Button size="sm" variant="outline" className="text-xs">
                Re-scan
              </Button>
            </Link>
          </div>
        </div>

        {/* Top bar without rescan button for shared scans */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {result.domain}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Shared scan result
          </p>
        </div>

        <div className="mt-4">
          <HeroBand result={result} />
        </div>
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <CertChain chain={result.chain} />
            <ProtocolTable protocols={result.protocols} />
            <CipherSuites cipherSuites={result.cipherSuites} />
            <VulnPanel vulnerabilities={result.vulnerabilities} />
          </div>
          <div className="space-y-4">
            <ExpiryCountdown chain={result.chain} />
            <SecurityHeaders headers={result.headers} />
            <CertDetails chain={result.chain} />
            <LearnMore />
          </div>
        </div>
      </div>
    </div>
  );
}
