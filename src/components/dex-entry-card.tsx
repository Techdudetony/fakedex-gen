import type { DexEntry } from "@/lib/types";
import { StatBars, StatRadar, TypeBadge, dexNumber } from "./dex-ui";

/** The full dex page for one fakemon. Also used as the preview before saving. */
export function DexEntryCard({ entry }: { entry: Omit<DexEntry, "id" | "number" | "createdAt"> & { number?: number } }) {
  return (
    <article className="overflow-hidden rounded-3xl border-4 border-dex-red bg-dex-panel shadow-lg">
      <div className="flex items-baseline gap-3 bg-dex-red px-5 py-3 text-white">
        <span className="font-mono text-lg opacity-90">{entry.number ? dexNumber(entry.number) : "#???"}</span>
        <h1 className="text-2xl font-black tracking-tight">{entry.name}</h1>
        <span className="ml-auto text-sm opacity-90">The {entry.category} Fakemon</span>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl border-4 border-dex-line bg-dex-screen">
            <img src={entry.imageUrl} alt={entry.name} className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center text-sm">
            {[
              ["Height", entry.height],
              ["Weight", entry.weight],
              ["Habitat", entry.habitat],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-dex-track px-2 py-2">
                <dt className="text-xs text-dex-muted">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl bg-dex-screen p-4">
            <p className="leading-relaxed">{entry.flavorText}</p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-dex-muted">Abilities</h2>
            <ul className="space-y-2">
              {entry.abilities.map((a) => (
                <li key={a.name}>
                  <span className="font-semibold">{a.name}</span>
                  {a.hidden && <span className="ml-2 text-xs text-dex-muted">(hidden)</span>}
                  <p className="text-sm text-dex-muted">{a.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-dex-muted">Signature move</h2>
            <p>
              <span className="font-semibold">{entry.signatureMove.name}</span>{" "}
              <TypeBadge type={entry.signatureMove.type} />
            </p>
            <p className="text-sm text-dex-muted">{entry.signatureMove.description}</p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-dex-muted">Base stats</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-56 flex-1">
                <StatBars stats={entry.stats} />
              </div>
              <StatRadar stats={entry.stats} size={200} />
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
