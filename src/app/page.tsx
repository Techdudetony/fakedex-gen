import { Suspense } from "react";
import Link from "next/link";
import { DexBrowser } from "@/components/dex-browser";
import { getStore } from "@/lib/store";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">My Fakedex</h1>
        <p className="text-dex-muted">Every fakemon you&apos;ve created, in dex order.</p>
      </div>
      <Suspense fallback={<p className="text-dex-muted">Loading entries…</p>}>
        <Entries />
      </Suspense>
    </div>
  );
}

async function Entries() {
  const entries = await getStore().list();
  if (!entries.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-dex-line p-12 text-center">
        <p className="mb-4 text-lg">Your dex is empty.</p>
        <Link href="/create" className="rounded-full bg-dex-red px-5 py-2 font-bold text-white hover:bg-dex-red-dark">
          Create your first fakemon
        </Link>
      </div>
    );
  }
  return <DexBrowser entries={entries} />;
}
