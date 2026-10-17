"use client";

import { useState } from "react";
import Link from "next/link";
import { FAKEMON_TYPES, type DexEntry, type FakemonType } from "@/lib/types";
import { TypeBadge, dexNumber } from "./dex-ui";

/** Searchable, type-filterable grid of dex entries. */
export function DexBrowser({ entries }: { entries: DexEntry[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<FakemonType | "">("");

  const q = query.trim().toLowerCase();
  const shown = entries.filter(
    (e) =>
      (!type || e.types.includes(type)) &&
      (!q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || String(e.number).includes(q)),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, category or number"
          className="min-w-0 flex-1 rounded-lg border border-dex-line bg-dex-panel px-3 py-2"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FakemonType | "")}
          className="rounded-lg border border-dex-line bg-dex-panel px-3 py-2"
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {FAKEMON_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {shown.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((e) => (
            <li key={e.id}>
              <Link
                href={`/entry/${e.id}`}
                className="block overflow-hidden rounded-2xl border border-dex-line bg-dex-panel shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-square bg-dex-screen">
                  <img src={e.imageUrl} alt={e.name} className="h-full w-full object-contain" loading="lazy" />
                </div>
                <div className="space-y-1.5 p-3">
                  <p className="font-mono text-xs text-dex-muted">{dexNumber(e.number)}</p>
                  <p className="font-bold">{e.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {e.types.map((t) => (
                      <TypeBadge key={t} type={t} />
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-dex-muted">No fakemon match that search.</p>
      )}
    </div>
  );
}
