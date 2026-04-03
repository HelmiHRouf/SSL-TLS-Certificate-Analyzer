"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButton } from "./ShareButton";

interface TopBarProps {
  domain: string;
  scannedAt: string;
  shareId: string;
  onRescan: () => void;
}

export function TopBar({ domain, scannedAt, shareId, onRescan }: TopBarProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between py-3 border-b">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          CertLens
        </Button>
        <span className="text-gray-400 dark:text-gray-600">|</span>
        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{domain}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">Scanned {scannedAt}</span>
      </div>
      <div className="flex items-center gap-2">
        <ShareButton shareId={shareId} />
        <Button
          variant="outline"
          size="sm"
          onClick={onRescan}
          className="gap-1"
        >
          Re-scan
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
