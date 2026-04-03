export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-6">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} CertLens. Built for educational purposes.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/HelmiHRouf/SSL-TLS-Certificate-Analyzer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-brand transition-colors"
          >
            Open Source
          </a>
        </div>
      </div>
    </footer>
  );
}
