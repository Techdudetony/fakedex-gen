import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DexEntry, SaveEntryRequest } from "./types";

/**
 * Entries live in Supabase when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 * Otherwise they go to a local .data/ folder, which is enough for development.
 */
export interface DexStore {
  list(): Promise<DexEntry[]>;
  get(id: string): Promise<DexEntry | null>;
  save(req: SaveEntryRequest): Promise<DexEntry>;
}

const BUCKET = "fakemon-images";
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function buildEntry(req: SaveEntryRequest, id: string, number: number, imageUrl: string): DexEntry {
  const { input, text } = req;
  return {
    id,
    number,
    createdAt: new Date().toISOString(),
    name: input.name,
    types: input.types,
    stats: input.stats,
    category: text.category,
    height: text.height,
    weight: text.weight,
    habitat: text.habitat,
    flavorText: text.flavorText,
    abilities: text.abilities,
    signatureMove: text.signatureMove,
    imagePrompt: text.imagePrompt,
    artStyle: input.artStyle,
    imageUrl,
  };
}

class SupabaseStore implements DexStore {
  constructor(private db: SupabaseClient) {}

  async list() {
    const { data, error } = await this.db
      .from("entries")
      .select("id, number, entry")
      .order("number", { ascending: true });
    if (error) throw error;
    return data.map((row) => ({ ...row.entry, id: row.id, number: row.number }) as DexEntry);
  }

  async get(id: string) {
    const { data, error } = await this.db
      .from("entries")
      .select("id, number, entry")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? ({ ...data.entry, id: data.id, number: data.number } as DexEntry) : null;
  }

  async save(req: SaveEntryRequest) {
    const id = randomUUID();
    const file = `${id}.${EXTENSIONS[req.image.mimeType] ?? "png"}`;
    const upload = await this.db.storage
      .from(BUCKET)
      .upload(file, Buffer.from(req.image.data, "base64"), { contentType: req.image.mimeType });
    if (upload.error) throw upload.error;
    const imageUrl = this.db.storage.from(BUCKET).getPublicUrl(file).data.publicUrl;

    // The dex number comes from the table's identity column.
    const draft = buildEntry(req, id, 0, imageUrl);
    const { data, error } = await this.db
      .from("entries")
      .insert({ id, entry: draft })
      .select("number")
      .single();
    if (error) throw error;
    return { ...draft, number: data.number };
  }
}

const DATA_DIR = path.join(process.cwd(), ".data");
const IMAGE_DIR = path.join(DATA_DIR, "images");
const INDEX_FILE = path.join(DATA_DIR, "entries.json");

class LocalStore implements DexStore {
  /** Saves run one at a time so two overlapping saves can't take the same number or drop an entry. */
  private saving: Promise<unknown> = Promise.resolve();

  private async readAll(): Promise<DexEntry[]> {
    try {
      return JSON.parse(await readFile(INDEX_FILE, "utf8"));
    } catch {
      return [];
    }
  }

  async list() {
    return (await this.readAll()).sort((a, b) => a.number - b.number);
  }

  async get(id: string) {
    return (await this.readAll()).find((e) => e.id === id) ?? null;
  }

  save(req: SaveEntryRequest): Promise<DexEntry> {
    const result = this.saving.then(() => this.saveNow(req));
    this.saving = result.catch(() => {});
    return result;
  }

  private async saveNow(req: SaveEntryRequest) {
    await mkdir(IMAGE_DIR, { recursive: true });
    const entries = await this.readAll();
    const id = randomUUID();
    const file = `${id}.${EXTENSIONS[req.image.mimeType] ?? "png"}`;
    await writeFile(path.join(IMAGE_DIR, file), Buffer.from(req.image.data, "base64"));

    const number = entries.reduce((max, e) => Math.max(max, e.number), 0) + 1;
    const entry = buildEntry(req, id, number, `/api/local-images/${file}`);
    await writeFile(INDEX_FILE, JSON.stringify([...entries, entry], null, 2));
    return entry;
  }
}

export async function readLocalImage(file: string): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!/^[0-9a-f-]+\.(png|jpg|webp|svg)$/.test(file)) return null;
  try {
    const data = await readFile(path.join(IMAGE_DIR, file));
    const ext = file.split(".").pop()!;
    const mimeType = Object.keys(EXTENSIONS).find((m) => EXTENSIONS[m] === ext)!;
    return { data, mimeType };
  } catch {
    return null;
  }
}

let store: DexStore | undefined;

export function getStore(): DexStore {
  if (!store) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    store = url && key
      ? new SupabaseStore(createClient(url, key, { auth: { persistSession: false } }))
      : new LocalStore();
  }
  return store;
}
