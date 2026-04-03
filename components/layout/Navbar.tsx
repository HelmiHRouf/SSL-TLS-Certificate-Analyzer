import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand">CertLens</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/learn"
            className="text-sm font-medium text-gray-600 hover:text-brand transition-colors"
          >
            Learn
          </Link>
          <a
            href="https://github.com/HelmiHRouf/SSL-TLS-Certificate-Analyzer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-600 hover:text-brand transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
