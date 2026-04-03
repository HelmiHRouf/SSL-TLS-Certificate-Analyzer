"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import type { ScanResult } from "@/types/cert";
import { HeroBand } from "@/components/results/HeroBand";
import { CertChain } from "@/components/results/CertChain";
import { ProtocolTable } from "@/components/results/ProtocolTable";
import { SecurityHeaders } from "@/components/results/SecurityHeaders";
import { ExpiryCountdown } from "@/components/results/ExpiryCountdown";
import { Loader2 } from "lucide-react";

async function analyzeDomain(domain: string): Promise<ScanResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze domain");
  }

  return response.json();
}

export default function ResultPage() {
  const params = useParams();
  const domain = decodeURIComponent((params.domain as string) || "");

  const { data, isLoading, error } = useQuery<ScanResult, Error>({
    queryKey: ["scan", domain],
    queryFn: () => analyzeDomain(domain),
    enabled: !!domain,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-gray-600">Analyzing {domain}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Analysis Failed</h1>
          <p className="text-gray-600 max-w-md">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top: Hero band with grade */}
        <HeroBand result={data} />

        {/* Middle: Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Chain, Protocols, Headers */}
          <div className="lg:col-span-2 space-y-6">
            <CertChain chain={data.chain} />
            <ProtocolTable protocols={data.protocols} />
            <SecurityHeaders headers={data.headers} />
          </div>

          {/* Right column: Expiry + other details */}
          <div className="space-y-6">
            <ExpiryCountdown chain={data.chain} />
            {/* Additional panels will go here: CipherSuites, VulnPanel, etc. */}
          </div>
        </div>
      </div>
    </div>
  );
}
