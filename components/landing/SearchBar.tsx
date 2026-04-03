"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ArrowRight } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || isLoading) return;

    setIsLoading(true);
    router.push(`/result/${encodeURIComponent(domain.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="relative flex items-center bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <Search className="absolute left-4 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="e.g. github.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="pl-12 pr-32 h-14 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !domain.trim()}
          className="absolute right-2 h-10 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Analyze
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
