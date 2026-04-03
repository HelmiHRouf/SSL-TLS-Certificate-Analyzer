import type { ChainEntry } from "@/types/cert";

interface ExpiryCountdownProps {
  chain: ChainEntry[];
}

export function ExpiryCountdown({ chain }: ExpiryCountdownProps) {
  const leaf = chain.find((c) => c.role === "leaf");

  if (!leaf) {
    return (
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4">Expiry</h2>
        <p className="text-gray-500">No certificate data available.</p>
      </div>
    );
  }

  const days = leaf.daysRemaining;
  const totalDays = 90; // Visual scale: 0-90 days
  const percentage = Math.min(100, Math.max(0, (days / totalDays) * 100));

  const getColor = () => {
    if (days < 30) return "text-grade-cf-text";
    if (days < 60) return "text-grade-b-text";
    return "text-grade-a-text";
  };

  const getBgColor = () => {
    if (days < 30) return "stroke-grade-cf-text";
    if (days < 60) return "stroke-grade-b-text";
    return "stroke-grade-a-text";
  };

  // SVG circle: circumference = 2 * PI * 45 ≈ 283
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-600"></div>
        <h2 className="text-sm font-semibold text-gray-900">Expiry</h2>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={getBgColor()}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: "stroke-dashoffset 0.5s ease",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getColor()}`}>{days}</span>
            <span className="text-xs text-gray-500">days</span>
          </div>
        </div>
        <div className="mt-4 text-center space-y-1">
          <p className="text-sm text-gray-700">
            Expires{" "}
            {leaf.validTo
              ? new Date(leaf.validTo).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Unknown"}
          </p>
          <p className="text-xs text-gray-500">
            Issued{" "}
            {leaf.validFrom
              ? new Date(leaf.validFrom).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}
