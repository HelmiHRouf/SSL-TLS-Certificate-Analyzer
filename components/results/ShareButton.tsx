"use client";

import { useState } from "react";
import { Copy, Check, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  shareId: string;
  variant?: "default" | "icon";
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function ShareButton({ shareId, variant = "default" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    const url = `${APP_URL}/r/${shareId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleShare}
        variant="outline"
        className="flex items-center gap-2"
        size="sm"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            <span>Share</span>
            <ExternalLink className="h-3 w-3 opacity-50" />
          </>
        )}
      </Button>
      
      {/* Toast notification */}
      {showToast && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2">
          Permalink copied to clipboard!
        </div>
      )}
    </div>
  );
}
