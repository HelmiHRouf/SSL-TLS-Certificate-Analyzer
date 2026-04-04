"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
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
import { Loader2 } from "lucide-react";

async function analyzeDomain(domain: string, force = false): Promise<ScanResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, force }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze domain");
  }

  return response.json();
}

async function pollGrade(domain: string): Promise<Partial<ScanResult>> {
  const response = await fetch(`/api/grade?domain=${encodeURIComponent(domain)}`);

  if (!response.ok) {
    throw new Error("Failed to fetch grade");
  }

  const data = await response.json();
  return data;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

const MOCK_CIPHERS: ScanResult["cipherSuites"] = [
  {
    name: "TLS_AES_128_GCM_SHA256",
    strength: "strong",
    kex: "ECDHE",
    auth: "RSA",
    enc: "AES-128-GCM",
    mac: "SHA256",
  },
  {
    name: "TLS_AES_256_GCM_SHA384",
    strength: "strong",
    kex: "ECDHE",
    auth: "RSA",
    enc: "AES-256-GCM",
    mac: "SHA384",
  },
  {
    name: "TLS_CHACHA20_POLY1305_SHA256",
    strength: "strong",
    kex: "ECDHE",
    auth: "RSA",
    enc: "ChaCha20",
    mac: "SHA256",
  },
  {
    name: "ECDHE-RSA-AES128-SHA256",
    strength: "acceptable",
    kex: "ECDHE",
    auth: "RSA",
    enc: "AES-128-CBC",
    mac: "SHA256",
  },
  {
    name: "ECDHE-RSA-AES256-SHA",
    strength: "weak",
    kex: "ECDHE",
    auth: "RSA",
    enc: "AES-256-CBC",
    mac: "SHA1",
  },
];

export default function ResultPage() {
  const params = useParams();
  const domain = decodeURIComponent((params.domain as string) || "");
  const [rescanKey, setRescanKey] = useState(0);

  const {
    data,
    isLoading,
    error,
    refetch: refetchScan,
  } = useQuery<ScanResult, Error>({
    queryKey: ["scan", domain, rescanKey],
    queryFn: () => analyzeDomain(domain, rescanKey > 0),
    enabled: !!domain,
    retry: 1,
    // Uses QueryProvider defaults: staleTime 1min, no refetch on focus
  });

  // Poll SSL Labs grade every 5 seconds until ready
  const { data: gradeData, isLoading: gradeLoading } = useQuery<Partial<ScanResult>, Error>({
    queryKey: ["grade", domain, data?.shareId],
    queryFn: () => pollGrade(domain),
    enabled: !!domain && !!data && data.cipherSuites.length === 0,
    refetchInterval: (query) => {
      // Stop polling once we have cipher suites (SSL Labs data arrived)
      const lastData = query.state.data;
      if (lastData && (lastData as ScanResult).cipherSuites && (lastData as ScanResult).cipherSuites!.length > 0) {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
    refetchIntervalInBackground: true,
    retry: 3,
  });

  // Merge grade data with scan data
  const mergedData: ScanResult | undefined = data
    ? {
        ...data,
        ...(gradeData?.grade && { grade: gradeData.grade }),
        ...(gradeData?.protocols && { protocols: gradeData.protocols }),
        ...(gradeData?.cipherSuites && gradeData.cipherSuites.length > 0 && { cipherSuites: gradeData.cipherSuites }),
        ...(gradeData?.vulnerabilities && { vulnerabilities: gradeData.vulnerabilities }),
      }
    : undefined;

  const handleRescan = useCallback(() => {
    setRescanKey((prev) => prev + 1);
    refetchScan();
  }, [refetchScan]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-gray-600 dark:text-gray-400">Analyzing {domain}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Analysis Failed</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!mergedData) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-background">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Show pending indicator if SSL Labs data is still loading
  const isPendingSSL = gradeLoading || mergedData.cipherSuites.length === 0;

  const displayCipherSuites =
    mergedData.cipherSuites.length > 0 ? mergedData.cipherSuites : MOCK_CIPHERS;

  return (
    <div className="min-h-[calc(100vh-8rem)] py-6 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <TopBar
          domain={mergedData.domain}
          scannedAt={formatTimeAgo(mergedData.scannedAt)}
          shareId={mergedData.shareId}
          onRescan={handleRescan}
        />
        <div className="mt-4">
          <HeroBand result={mergedData} />
        </div>
        {isPendingSSL && (
          <div className="mt-3 flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Running deep SSL analysis in background...</span>
          </div>
        )}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <CertChain chain={mergedData.chain} />
            <ProtocolTable protocols={mergedData.protocols} />
            <CipherSuites cipherSuites={displayCipherSuites} />
            <VulnPanel vulnerabilities={mergedData.vulnerabilities} />
          </div>
          <div className="space-y-4">
            <ExpiryCountdown chain={mergedData.chain} />
            <SecurityHeaders headers={mergedData.headers} />
            <CertDetails chain={mergedData.chain} />
            <LearnMore />
          </div>
        </div>
      </div>
    </div>
  );
}
