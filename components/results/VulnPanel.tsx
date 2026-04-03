import type { VulnResult } from "@/types/cert";
import { Check, X } from "lucide-react";
import { LearnTooltip } from "./LearnTooltip";
import { LEARN_CONTENT } from "@/lib/learn-content";

interface VulnPanelProps {
  vulnerabilities: VulnResult[];
}

export function VulnPanel({ vulnerabilities }: VulnPanelProps) {
  if (vulnerabilities.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4">Vulnerability scan</h2>
        <p className="text-gray-500">No vulnerability data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-red-600"></div>
        <h2 className="text-sm font-semibold text-gray-900">Vulnerability scan</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {vulnerabilities.map((vuln) => {
          const learn = LEARN_CONTENT.vulnerabilities[vuln.slug as keyof typeof LEARN_CONTENT.vulnerabilities];
          return (
            <div
              key={vuln.slug}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                vuln.safe
                  ? "bg-green-50/50 border-green-200"
                  : "bg-red-50/50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {vuln.safe ? (
                  <Check className="h-4 w-4 text-green-700 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-red-700 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-800">{vuln.name}</span>
              </div>
              {learn && (
                <LearnTooltip
                  title={learn.title}
                  description={learn.description}
                  link={learn.link}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}