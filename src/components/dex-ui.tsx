import { STAT_KEYS, STAT_LABELS, statTotal, type FakemonType, type Stats } from "@/lib/types";

export const TYPE_COLORS: Record<FakemonType, string> = {
  Normal: "#9a9a7a",
  Fire: "#e8742c",
  Water: "#4f86e8",
  Grass: "#5fae47",
  Electric: "#e6c02a",
  Ice: "#6fc8c8",
  Fighting: "#b8382e",
  Poison: "#9445a0",
  Ground: "#cfa555",
  Flying: "#9384e6",
  Psychic: "#ea5683",
  Bug: "#99ab22",
  Rock: "#b09b3c",
  Ghost: "#6a568f",
  Dragon: "#6a3ef0",
  Dark: "#6b574a",
  Steel: "#a6a6c4",
  Fairy: "#e391b0",
};

export function TypeBadge({ type }: { type: FakemonType }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  );
}

export function dexNumber(n: number) {
  return `#${String(n).padStart(3, "0")}`;
}

/** Horizontal stat bars, scaled to the 255 max. */
export function StatBars({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-1.5">
      {STAT_KEYS.map((k) => (
        <div key={k} className="grid grid-cols-[4.5rem_2.5rem_1fr] items-center gap-2 text-sm">
          <span className="text-dex-muted">{STAT_LABELS[k]}</span>
          <span className="text-right font-mono font-semibold tabular-nums">{stats[k]}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-dex-track">
            <div className="h-full rounded-full" style={{ width: `${(stats[k] / 255) * 100}%`, backgroundColor: statColor(stats[k]) }} />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[4.5rem_2.5rem_1fr] gap-2 border-t border-dex-line pt-1.5 text-sm">
        <span className="text-dex-muted">Total</span>
        <span className="text-right font-mono font-bold tabular-nums">{statTotal(stats)}</span>
      </div>
    </div>
  );
}

function statColor(v: number) {
  if (v < 50) return "#e5533d";
  if (v < 80) return "#ef9a2e";
  if (v < 110) return "#e3c53a";
  if (v < 140) return "#7cc04f";
  return "#3fae8f";
}

/** Hexagonal stat chart. Values are drawn against the 255 max so shapes are comparable across entries. */
export function StatRadar({ stats, size = 220 }: { stats: Stats; size?: number }) {
  const c = size / 2;
  const r = size / 2 - 34;
  const point = (i: number, scale: number) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    return [c + Math.cos(angle) * r * scale, c + Math.sin(angle) * r * scale] as const;
  };
  const ring = (scale: number) => STAT_KEYS.map((_, i) => point(i, scale).join(",")).join(" ");
  const shape = STAT_KEYS.map((k, i) => point(i, stats[k] / 255).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Base stat chart">
      {[1, 0.66, 0.33].map((s) => (
        <polygon key={s} points={ring(s)} fill="none" stroke="var(--dex-line)" />
      ))}
      <polygon points={shape} fill="var(--dex-red)" fillOpacity={0.35} stroke="var(--dex-red)" strokeWidth={2} />
      {STAT_KEYS.map((k, i) => {
        const [x, y] = point(i, 1.22);
        return (
          <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="var(--dex-muted)">
            {STAT_LABELS[k]} {stats[k]}
          </text>
        );
      })}
    </svg>
  );
}
