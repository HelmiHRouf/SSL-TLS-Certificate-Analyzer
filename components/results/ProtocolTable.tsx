import type { ProtocolSupport } from "@/types/cert";
import { LearnTooltip } from "./LearnTooltip";
import { LEARN_CONTENT } from "@/lib/learn-content";
import { Loader2 } from "lucide-react";

interface ProtocolTableProps {
  protocols: ProtocolSupport[];
}

export function ProtocolTable({ protocols }: ProtocolTableProps) {
  const order = ["TLS 1.3", "TLS 1.2", "TLS 1.1", "TLS 1.0", "SSL 3.0"];
  const sorted = [...protocols].sort(
    (a, b) => order.indexOf(a.version) - order.indexOf(b.version),
  );

  return (
    <div className="bg-white dark:bg-gray-900 border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Protocol support</h2>
      </div>
      <div className="space-y-2">
        {sorted.map((protocol) => {
          const learn = LEARN_CONTENT.protocols[protocol.version as keyof typeof LEARN_CONTENT.protocols];
          return (
            <div
              key={protocol.version}
              className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100 dark:border-gray-800"
            >
              <span className="text-sm text-gray-800 dark:text-gray-200">{protocol.version}</span>
              <div className="flex items-center">
                {protocol.detectionStatus === "unknown" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Scanning…
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      protocol.supported
                        ? protocol.risk === "none"
                          ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {protocol.supported ? "Supported" : "Disabled"}
                  </span>
                )}
                {learn && (
                  <LearnTooltip
                    title={learn.title}
                    description={learn.description}
                    link={learn.link}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
