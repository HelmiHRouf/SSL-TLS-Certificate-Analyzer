import type { SecurityHeader } from "@/types/cert";
import { Check, X, AlertCircle } from "lucide-react";

interface SecurityHeadersProps {
  headers: SecurityHeader[];
}

export function SecurityHeaders({ headers }: SecurityHeadersProps) {
  const getIcon = (status: SecurityHeader["status"]) => {
    switch (status) {
      case "present":
        return <Check className="h-4 w-4 text-grade-a-text" />;
      case "missing":
        return <X className="h-4 w-4 text-grade-cf-text" />;
      case "misconfigured":
        return <AlertCircle className="h-4 w-4 text-grade-b-text" />;
    }
  };

  const getChipStyle = (status: SecurityHeader["status"]) => {
    switch (status) {
      case "present":
        return "bg-grade-a-bg text-grade-a-text";
      case "missing":
        return "bg-grade-cf-bg text-grade-cf-text";
      case "misconfigured":
        return "bg-grade-b-bg text-grade-b-text";
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Security Headers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {headers.map((header) => (
          <div
            key={header.name}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
          >
            <span className="font-medium text-gray-900">{header.name}</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getChipStyle(
                header.status
              )}`}
            >
              {getIcon(header.status)}
              <span className="capitalize">{header.status}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
