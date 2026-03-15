import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Project Horizon | GTM Benchmark Intelligence",
  description:
    "Real benchmarks from 500+ B2B SaaS companies. Compare GTM metrics, analyze go-to-market strategies, and track competitive positioning.",
  openGraph: {
    title: "Project Horizon | GTM Benchmark Intelligence",
    description:
      "Real benchmarks from 500+ B2B SaaS companies. Compare GTM metrics across stages, industries, and motions.",
    type: "website",
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23020617'/><circle cx='16' cy='16' r='6' fill='%233b82f6'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="max-w-[1200px] mx-auto p-4 md:p-6 pb-20 md:pb-6">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
