import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CertLens — SSL/TLS Certificate Analyzer",
  description:
    "Analyze any domain's TLS configuration — certificate chain, protocol support, cipher suites, vulnerability exposure, and security headers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
        <body className="font-sans antialiased min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <QueryProvider>
            <Navbar />
            <main className="flex-1 bg-background">{children}</main>
            <Footer />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
