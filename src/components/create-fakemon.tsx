"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ART_STYLES,
  FAKEMON_TYPES,
  STAT_KEYS,
  STAT_LABELS,
  statTotal,
  type Ability,
  type DexEntry,
  type FakemonInput,
  type FakemonType,
  type GeneratedText,
  type ReferenceImage,
} from "@/lib/types";
import { DexEntryCard } from "./dex-entry-card";
import { StatRadar } from "./dex-ui";

type Candidate = { mimeType: string; data: string };

const MAX_REFERENCES = 3;
const MAX_REFERENCE_BYTES = 4 * 1024 * 1024;

const EMPTY_INPUT: FakemonInput = {
  name: "",
  types: ["Fire"],
  stats: { hp: 60, atk: 70, def: 55, spa: 80, spd: 60, spe: 90 },
  abilities: [{ name: "", description: "", hidden: false }],
  category: "",
  height: "",
  weight: "",
  habitat: "",
  inspiration: "",
  designNotes: "",
  artStyle: ART_STYLES[0],
  palette: [],
};

export function CreateFakemon() {
  const router = useRouter();
  const [input, setInput] = useState<FakemonInput>(EMPTY_INPUT);
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [text, setText] = useState<GeneratedText | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [chosen, setChosen] = useState(0);
  const [busy, setBusy] = useState<"" | "text" | "images" | "save">("");
  const [error, setError] = useState("");

  const set = <K extends keyof FakemonInput>(key: K, value: FakemonInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  async function post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json;
  }

  async function generateImages(prompt: string) {
    setBusy("images");
    setError("");
    try {
      const { images } = await post<{ images: Candidate[] }>("/api/images", { prompt, references, count: 4 });
      setCandidates(images);
      setChosen(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function generate() {
    setBusy("text");
    setError("");
    try {
      const cleaned = { ...input, abilities: input.abilities.filter((a) => a.name.trim()) };
      const { text } = await post<{ text: GeneratedText }>("/api/generate", { input: cleaned, references });
      setText(text);
      setCandidates([]);
      await generateImages(text.imagePrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy("");
    }
  }

  async function save() {
    if (!text || !candidates[chosen]) return;
    setBusy("save");
    setError("");
    try {
      const cleaned = { ...input, abilities: input.abilities.filter((a) => a.name.trim()) };
      const { entry } = await post<{ entry: DexEntry }>("/api/entries", {
        input: cleaned,
        text,
        image: candidates[chosen],
      });
      router.push(`/entry/${entry.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy("");
    }
  }

  async function addReferences(files: FileList | null) {
    if (!files) return;
    const room = MAX_REFERENCES - references.length;
    const accepted: ReferenceImage[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        setError(`${file.name} isn't a PNG, JPEG or WebP image.`);
        continue;
      }
      if (file.size > MAX_REFERENCE_BYTES) {
        setError(`${file.name} is over 4 MB.`);
        continue;
      }
      accepted.push({ mimeType: file.type as ReferenceImage["mimeType"], data: await toBase64(file) });
    }
    setReferences((prev) => [...prev, ...accepted]);
  }

  const canGenerate = input.name.trim() && !busy;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Panel title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <input value={input.name} onChange={(e) => set("name", e.target.value)} className={inputClass} maxLength={40} placeholder="Embrix" />
              </Field>
              <Field label="Category" hint='"the ___ Fakemon"'>
                <input value={input.category} onChange={(e) => set("category", e.target.value)} className={inputClass} placeholder="Ember Fox" />
              </Field>
              <Field label="Primary type">
                <TypeSelect value={input.types[0]} onChange={(t) => set("types", [t!, ...input.types.slice(1)])} />
              </Field>
              <Field label="Secondary type">
                <TypeSelect
                  value={input.types[1]}
                  optional
                  onChange={(t) => set("types", t && t !== input.types[0] ? [input.types[0], t] : [input.types[0]])}
                />
              </Field>
              <Field label="Height">
                <input value={input.height} onChange={(e) => set("height", e.target.value)} className={inputClass} placeholder="0.9 m" />
              </Field>
              <Field label="Weight">
                <input value={input.weight} onChange={(e) => set("weight", e.target.value)} className={inputClass} placeholder="12.4 kg" />
              </Field>
              <Field label="Habitat" className="sm:col-span-2">
                <input value={input.habitat} onChange={(e) => set("habitat", e.target.value)} className={inputClass} placeholder="Volcanic foothills" />
              </Field>
            </div>
          </Panel>

          <Panel title="Abilities">
            <div className="space-y-3">
              {input.abilities.map((a, i) => (
                <AbilityRow
                  key={i}
                  ability={a}
                  onChange={(next) => set("abilities", input.abilities.map((x, j) => (j === i ? next : x)))}
                  onRemove={() => set("abilities", input.abilities.filter((_, j) => j !== i))}
                />
              ))}
              {input.abilities.length < 3 && (
                <button
                  type="button"
                  onClick={() => set("abilities", [...input.abilities, { name: "", description: "", hidden: false }])}
                  className="text-sm font-semibold text-dex-red hover:underline"
                >
                  + Add ability
                </button>
              )}
              <p className="text-xs text-dex-muted">Leave these empty and the dex will suggest some.</p>
            </div>
          </Panel>

          <Panel title="Design">
            <div className="grid gap-4">
              <Field label="Inspired by" hint="animals, objects, myths">
                <input value={input.inspiration} onChange={(e) => set("inspiration", e.target.value)} className={inputClass} placeholder="fennec fox, lava lamp" />
              </Field>
              <Field label="Design notes">
                <textarea
                  value={input.designNotes}
                  onChange={(e) => set("designNotes", e.target.value)}
                  className={`${inputClass} min-h-28`}
                  placeholder="Big ears that glow at the tips, a tail made of smoke, mischievous grin…"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Art style">
                  <select value={input.artStyle} onChange={(e) => set("artStyle", e.target.value as FakemonInput["artStyle"])} className={inputClass}>
                    {ART_STYLES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Color palette" hint="up to 5">
                  <div className="flex flex-wrap items-center gap-2">
                    {input.palette.map((c, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <input
                          type="color"
                          value={c}
                          onChange={(e) => set("palette", input.palette.map((x, j) => (j === i ? e.target.value : x)))}
                          className="h-9 w-9 cursor-pointer rounded border border-dex-line"
                          aria-label={`Palette color ${i + 1}`}
                        />
                        <button type="button" onClick={() => set("palette", input.palette.filter((_, j) => j !== i))} className="text-dex-muted hover:text-dex-red" aria-label="Remove color">
                          ×
                        </button>
                      </span>
                    ))}
                    {input.palette.length < 5 && (
                      <button type="button" onClick={() => set("palette", [...input.palette, "#e8742c"])} className="rounded-lg border border-dashed border-dex-line px-3 py-1.5 text-sm">
                        + Color
                      </button>
                    )}
                  </div>
                </Field>
              </div>
              <Field label="Reference images" hint={`up to ${MAX_REFERENCES}, used as loose inspiration`}>
                <div className="flex flex-wrap gap-3">
                  {references.map((ref, i) => (
                    <div key={i} className="relative">
                      <img src={`data:${ref.mimeType};base64,${ref.data}`} alt={`Reference ${i + 1}`} className="h-20 w-20 rounded-lg border border-dex-line object-cover" />
                      <button
                        type="button"
                        onClick={() => setReferences(references.filter((_, j) => j !== i))}
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-dex-red text-sm text-white"
                        aria-label="Remove reference"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {references.length < MAX_REFERENCES && (
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-dex-line text-2xl text-dex-muted hover:border-dex-red">
                      +
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          addReferences(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Base stats">
            <div className="flex justify-center">
              <StatRadar stats={input.stats} size={240} />
            </div>
            <div className="mt-2 space-y-2">
              {STAT_KEYS.map((k) => (
                <label key={k} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2 text-sm">
                  <span className="text-dex-muted">{STAT_LABELS[k]}</span>
                  <input
                    type="range"
                    min={1}
                    max={255}
                    value={input.stats[k]}
                    onChange={(e) => set("stats", { ...input.stats, [k]: Number(e.target.value) })}
                    className="accent-dex-red"
                  />
                  <input
                    type="number"
                    min={1}
                    max={255}
                    value={input.stats[k]}
                    onChange={(e) => set("stats", { ...input.stats, [k]: clampStat(e.target.value) })}
                    className="rounded border border-dex-line bg-dex-panel px-1.5 py-0.5 text-right font-mono"
                    aria-label={STAT_LABELS[k]}
                  />
                </label>
              ))}
              <p className="pt-1 text-right text-sm">
                Total <span className="font-mono font-bold">{statTotal(input.stats)}</span>
              </p>
            </div>
          </Panel>

          <button
            type="button"
            disabled={!canGenerate}
            onClick={generate}
            className="w-full rounded-full bg-dex-red py-3 text-lg font-bold text-white shadow hover:bg-dex-red-dark disabled:opacity-50"
          >
            {busy === "text" ? "Writing dex entry…" : busy === "images" && !candidates.length ? "Drawing…" : text ? "Regenerate entry" : "Generate entry"}
          </button>
          {!input.name.trim() && <p className="text-center text-sm text-dex-muted">Give your fakemon a name to start.</p>}
          {error && <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p>}
        </div>
      </div>

      {text && (
        <div className="space-y-6 border-t border-dex-line pt-8">
          <Panel title="Pick an image">
            {busy === "images" ? (
              <p className="py-8 text-center text-dex-muted">Drawing {input.name}…</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {candidates.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setChosen(i)}
                    className={`aspect-square overflow-hidden rounded-xl border-4 bg-dex-screen ${i === chosen ? "border-dex-red" : "border-transparent"}`}
                    aria-pressed={i === chosen}
                  >
                    <img src={`data:${c.mimeType};base64,${c.data}`} alt={`Option ${i + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 space-y-2">
              <Field label="Image prompt" hint="edit and redraw to tweak the design">
                <textarea
                  value={text.imagePrompt}
                  onChange={(e) => setText({ ...text, imagePrompt: e.target.value })}
                  className={`${inputClass} min-h-24 text-sm`}
                />
              </Field>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => generateImages(text.imagePrompt)}
                className="rounded-full border-2 border-dex-red px-4 py-1.5 text-sm font-bold text-dex-red disabled:opacity-50"
              >
                Redraw images
              </button>
            </div>
          </Panel>

          <Panel title="Flavor text">
            <textarea
              value={text.flavorText}
              onChange={(e) => setText({ ...text, flavorText: e.target.value })}
              className={`${inputClass} min-h-20`}
            />
          </Panel>

          {candidates[chosen] && (
            <>
              <DexEntryCard
                entry={{
                  ...text,
                  name: input.name,
                  types: input.types,
                  stats: input.stats,
                  artStyle: input.artStyle,
                  imageUrl: `data:${candidates[chosen].mimeType};base64,${candidates[chosen].data}`,
                }}
              />
              <button
                type="button"
                disabled={!!busy}
                onClick={save}
                className="w-full rounded-full bg-dex-red py-3 text-lg font-bold text-white shadow hover:bg-dex-red-dark disabled:opacity-50"
              >
                {busy === "save" ? "Saving…" : "Save to my dex"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-dex-line bg-dex-panel px-3 py-2";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-dex-line bg-dex-panel p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-dex-muted">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, required, className = "", children }: { label: string; hint?: string; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <span className="block text-sm font-semibold">
        {label}
        {required && <span className="text-dex-red"> *</span>}
        {hint && <span className="ml-2 font-normal text-dex-muted">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

function TypeSelect({ value, optional, onChange }: { value?: FakemonType; optional?: boolean; onChange: (t?: FakemonType) => void }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange((e.target.value || undefined) as FakemonType | undefined)} className={inputClass}>
      {optional && <option value="">None</option>}
      {FAKEMON_TYPES.map((t) => (
        <option key={t}>{t}</option>
      ))}
    </select>
  );
}

function AbilityRow({ ability, onChange, onRemove }: { ability: Ability; onChange: (a: Ability) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-2 rounded-xl bg-dex-track/50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
      <input value={ability.name} onChange={(e) => onChange({ ...ability, name: e.target.value })} className={inputClass} placeholder="Ability name" maxLength={60} />
      <input value={ability.description} onChange={(e) => onChange({ ...ability, description: e.target.value })} className={inputClass} placeholder="What it does" maxLength={300} />
      <div className="flex items-center gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={ability.hidden} onChange={(e) => onChange({ ...ability, hidden: e.target.checked })} />
          Hidden
        </label>
        <button type="button" onClick={onRemove} className="text-dex-muted hover:text-dex-red" aria-label="Remove ability">
          ×
        </button>
      </div>
    </div>
  );
}

function clampStat(raw: string) {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? Math.min(255, Math.max(1, n)) : 1;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
