import { Shield, Layers, AlertTriangle, Timer, FileCheck, Link2 } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Certificate chain",
    description: "Root CA → intermediate → leaf, with full issuer details and SAN list.",
    color: "bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400",
  },
  {
    icon: Layers,
    title: "Cipher suite breakdown",
    description: "Every cipher scored by strength — strong, acceptable, weak, or insecure.",
    color: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
  },
  {
    icon: AlertTriangle,
    title: "Vulnerability scan",
    description: "Heartbleed, POODLE, BEAST, ROBOT, DROWN, FREAK — all checked.",
    color: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
  },
  {
    icon: Timer,
    title: "Expiry countdown",
    description: "Days remaining with color-coded urgency: green, amber, or red.",
    color: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
  },
  {
    icon: FileCheck,
    title: "Security headers",
    description: "HSTS, CSP, X-Frame-Options — present, missing, or misconfigured.",
    color: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
  },
  {
    icon: Link2,
    title: "Shareable permalink",
    description: "Every scan gets a unique link — share findings with your team instantly.",
    color: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
  },
];

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEATURES.map((feature) => (
        <div
          key={feature.title}
          className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all"
        >
          <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
            <feature.icon className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{feature.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}