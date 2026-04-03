"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  domain: string;
  scannedAt: string;
  shareId: string;
  onRescan: () => void;
}

export function TopBar({ domain, scannedAt, shareId, onRescan }: TopBarProps) {
  const router = useRouter();

  const handleShare = async () => {
    const url = `${window.location.origin}/r/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      // Could show toast here
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

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
        <span className="text-gray-400">|</span>
        <span className="font-mono text-sm text-gray-900">{domain}</span>
        <span className="text-sm text-gray-500">Scanned {scannedAt}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-1"
        >
          Share
          <Share2 className="h-3.5 w-3.5" />
        </Button>
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