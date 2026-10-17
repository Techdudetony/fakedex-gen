import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fakedex",
  description: "Create original fakemon and build your own dex.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="bg-dex-red text-white shadow-md">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight">
              <span className="inline-block h-6 w-6 rounded-full border-4 border-white bg-sky-400 shadow-inner" />
              Fakedex
            </Link>
            <Link href="/" className="text-sm font-semibold opacity-90 hover:opacity-100">
              My dex
            </Link>
            <Link
              href="/create"
              className="ml-auto rounded-full bg-white px-4 py-1.5 text-sm font-bold text-dex-red-dark hover:bg-white/90"
            >
              New fakemon
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
