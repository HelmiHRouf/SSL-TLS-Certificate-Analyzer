import type { ProtocolSupport } from "@/types/cert";
import { Check, X, AlertTriangle } from "lucide-react";

interface ProtocolTableProps {
  protocols: ProtocolSupport[];
}

export function ProtocolTable({ protocols }: ProtocolTableProps) {
  // Sort in order: TLS 1.3, 1.2, 1.1, 1.0, SSL 3.0
  const order = ["TLS 1.3", "TLS 1.2", "TLS 1.1", "TLS 1.0", "SSL 3.0"];
  const sorted = protocols.sort(
    (a, b) => order.indexOf(a.version) - order.indexOf(b.version)
  );

  const getRiskStyle = (protocol: ProtocolSupport) => {
    if (!protocol.supported) {
      return {
        bg: "bg-gray-100",
        text: "text-gray-600",
        label: "Disabled",
        icon: <X className="h-4 w-4" />,
      };
    }
    switch (protocol.risk) {
      case "none":
        return {
          bg: "bg-grade-a-bg",
          text: "text-grade-a-text",
          label: "Supported",
          icon: <Check className="h-4 w-4" />,
        };
      case "low":
        return {
          bg: "bg-grade-b-bg",
          text: "text-grade-b-text",
          label: "Deprecated",
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      case "high":
        return {
          bg: "bg-grade-cf-bg",
          text: "text-grade-cf-text",
          label: "Critical",
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          label: protocol.supported ? "Supported" : "Disabled",
          icon: protocol.supported ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          ),
        };
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Protocol Support</h2>
      <div className="space-y-2">
        {sorted.map((protocol) => {
          const style = getRiskStyle(protocol);
          return (
            <div
              key={protocol.version}
              className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100"
            >
              <span className="font-medium text-gray-900">{protocol.version}</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
              >
                {style.icon}
                {style.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
