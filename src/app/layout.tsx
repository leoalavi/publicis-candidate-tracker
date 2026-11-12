import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Candidate Tracker",
  description: "A simple applicant tracking demo (fictional data only).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
          >
            <Link href="/" className="text-lg font-semibold">
              Candidate Tracker
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-slate-700 hover:text-slate-950 hover:underline">
                Candidates
              </Link>
              <Link
                href="/candidates/new"
                className="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
              >
                Add candidate
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-6 text-xs text-slate-500">
          Assessment demo with fictional data only. No authentication — not for real candidate data.
        </footer>
      </body>
    </html>
  );
}
