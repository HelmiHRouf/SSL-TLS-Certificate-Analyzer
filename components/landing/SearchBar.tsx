"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      // Navigate to results page — the page will trigger the actual scan
      router.push(`/result/${encodeURIComponent(domain.trim())}`);
    } catch {
      setError("Failed to navigate. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="e.g. github.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="pl-10 pr-24 h-12 text-base rounded-lg border-gray-200 focus:border-brand focus:ring-brand"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !domain.trim()}
          className="absolute right-1.5 h-9 bg-brand hover:bg-brand/90"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Analyze"
          )}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
