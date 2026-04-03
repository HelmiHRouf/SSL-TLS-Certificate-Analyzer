import type { SecurityHeader } from "@/types/cert";
import { LearnTooltip } from "./LearnTooltip";
import { LEARN_CONTENT } from "@/lib/learn-content";

interface SecurityHeadersProps {
  headers: SecurityHeader[];
}

export function SecurityHeaders({ headers }: SecurityHeadersProps) {
  const getDisplay = (status: SecurityHeader["status"]) => {
    if (status === "present") {
      return { label: "Present", classes: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400" };
    }
    if (status === "misconfigured") {
      return { label: "Partial", classes: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400" };
    }
    return { label: "Missing", classes: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" };
  };

  return (
    <div className="bg-white dark:bg-gray-900 border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Security headers</h2>
      </div>
      <div className="space-y-2">
        {headers.map((header) => {
          const learn = LEARN_CONTENT.headers[header.name as keyof typeof LEARN_CONTENT.headers];
          const display = getDisplay(header.status);
          return (
            <div
              key={header.name}
              className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center">
                <span className="text-sm text-gray-800 dark:text-gray-200">{header.name}</span>
                {learn && (
                  <LearnTooltip
                    title={learn.title}
                    description={learn.description}
                    link={learn.link}
                  />
                )}
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${display.classes}`}
              >
                {display.label}
              </span>
            </div>
          );
        })}
      </div>
      <a
        href="/learn/security-headers"
        className="inline-block mt-3 text-sm text-learn hover:underline"
      >
        Learn about security headers →
      </a>
    </div>
  );
}
