import { z } from "zod";

export const FAKEMON_TYPES = [
  "Normal",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
] as const;

export type FakemonType = (typeof FAKEMON_TYPES)[number];

export const ART_STYLES = [
  "Official art (clean cel-shaded)",
  "Retro pixel sprite",
  "Anime screenshot",
  "Painterly watercolor",
  "Trading card illustration",
] as const;

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  atk: "Attack",
  def: "Defense",
  spa: "Sp. Atk",
  spd: "Sp. Def",
  spe: "Speed",
};

const StatsSchema = z.object({
  hp: z.number().int().min(1).max(255),
  atk: z.number().int().min(1).max(255),
  def: z.number().int().min(1).max(255),
  spa: z.number().int().min(1).max(255),
  spd: z.number().int().min(1).max(255),
  spe: z.number().int().min(1).max(255),
});
export type Stats = z.infer<typeof StatsSchema>;

const AbilitySchema = z.object({
  name: z.string().max(60),
  description: z.string().max(300),
  hidden: z.boolean(),
});
export type Ability = z.infer<typeof AbilitySchema>;

/** What the user feeds in on the create page. Most fields are optional; Claude fills the gaps. */
export const FakemonInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  types: z.array(z.enum(FAKEMON_TYPES)).min(1).max(2),
  stats: StatsSchema,
  abilities: z.array(AbilitySchema).max(3),
  category: z.string().max(40).default(""),
  height: z.string().max(20).default(""),
  weight: z.string().max(20).default(""),
  habitat: z.string().max(120).default(""),
  inspiration: z.string().max(300).default(""),
  designNotes: z.string().max(2000).default(""),
  artStyle: z.enum(ART_STYLES),
  palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(5),
});
export type FakemonInput = z.infer<typeof FakemonInputSchema>;

/** A reference image the user uploaded, sent as base64. */
export const ReferenceImageSchema = z.object({
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  data: z.string().max(6_000_000),
});
export type ReferenceImage = z.infer<typeof ReferenceImageSchema>;

/** What Claude writes from the input. */
export const GeneratedTextSchema = z.object({
  category: z.string().describe('Short species category, e.g. "Ember Fox" (shown as "the Ember Fox Fakemon")'),
  height: z.string().describe('Height with units, e.g. "0.9 m"'),
  weight: z.string().describe('Weight with units, e.g. "12.4 kg"'),
  habitat: z.string(),
  flavorText: z.string().describe("Two or three sentence dex entry in the style of a Pokédex"),
  abilities: z
    .array(z.object({ name: z.string(), description: z.string(), hidden: z.boolean() }))
    .describe("The user's abilities, polished, plus a hidden ability if none was given"),
  signatureMove: z.object({
    name: z.string(),
    type: z.enum(FAKEMON_TYPES),
    description: z.string(),
  }),
  imagePrompt: z.string().describe("A detailed visual description for an image model; describes only the creature, its pose, colors and the art style"),
});
export type GeneratedText = z.infer<typeof GeneratedTextSchema>;

export type DexEntry = {
  id: string;
  number: number;
  createdAt: string;
  name: string;
  types: FakemonType[];
  stats: Stats;
  category: string;
  height: string;
  weight: string;
  habitat: string;
  flavorText: string;
  abilities: Ability[];
  signatureMove: GeneratedText["signatureMove"];
  imagePrompt: string;
  artStyle: string;
  imageUrl: string;
};

export const SaveEntrySchema = z.object({
  input: FakemonInputSchema,
  text: GeneratedTextSchema,
  image: z.object({
    mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
    data: z.string(),
  }),
});
export type SaveEntryRequest = z.infer<typeof SaveEntrySchema>;

export function statTotal(stats: Stats): number {
  return STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
}
