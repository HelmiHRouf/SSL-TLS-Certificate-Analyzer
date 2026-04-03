import Link from "next/link";
import { ArrowRight } from "lucide-react";

const LEARN_LINKS = [
  { title: "How TLS handshakes work", link: "/learn/tls-handshake" },
  { title: "What is perfect forward secrecy?", link: "/learn/pfs" },
  { title: "Understanding cipher suites", link: "/learn/cipher-suites" },
  { title: "Why TLS 1.0 is broken", link: "/learn/tls-deprecated" },
];

export function LearnMore() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
        <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Learn more</h2>
      </div>
      <div className="space-y-2">
        {LEARN_LINKS.map((item) => (
          <Link
            key={item.link}
            href={item.link}
            className="flex items-center justify-between group text-sm text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 py-1"
          >
            <span className="group-hover:underline">{item.title}</span>
            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}
