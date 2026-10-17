import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  GeneratedTextSchema,
  STAT_KEYS,
  STAT_LABELS,
  type FakemonInput,
  type GeneratedText,
  type ReferenceImage,
} from "./types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

const SYSTEM = `You are the Fakedex, a Pokédex for original "fakemon" creatures.
Given a trainer's notes about a new creature, you write its dex entry and an image prompt.

- Keep every detail the trainer gave; fill in anything left blank so it fits the creature's types, stats and inspiration.
- Flavor text is 2-3 sentences, written like an in-world field guide: a surprising behavior or bit of lore, never a stat summary.
- The image prompt describes one original creature on a plain light background: body shape, features, colors (use the trainer's palette if given), pose, and the requested art style. Never name or describe existing Pokémon or other copyrighted characters.
- If reference images are attached, take design cues from them without copying them.`;

export async function generateDexText(
  input: FakemonInput,
  references: ReferenceImage[],
): Promise<GeneratedText> {
  if (!process.env.ANTHROPIC_API_KEY) return mockText(input);

  const client = new Anthropic();
  const content: Anthropic.Beta.BetaContentBlockParam[] = references.map((ref) => ({
    type: "image",
    source: { type: "base64", media_type: ref.mimeType, data: ref.data },
  }));
  content.push({ type: "text", text: describeInput(input) });

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(GeneratedTextSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The dex declined to write this entry. Try rewording the design notes.");
  }
  if (!response.parsed_output) {
    throw new Error("The dex entry came back malformed. Please try again.");
  }
  return response.parsed_output;
}

function describeInput(input: FakemonInput): string {
  const stats = STAT_KEYS.map((k) => `${STAT_LABELS[k]} ${input.stats[k]}`).join(", ");
  const abilities = input.abilities.length
    ? input.abilities
        .map((a) => `${a.name}${a.hidden ? " (hidden)" : ""}: ${a.description || "(no description)"}`)
        .join("\n  ")
    : "(none given)";
  const line = (label: string, value: string) => `${label}: ${value.trim() || "(not given)"}`;

  return [
    line("Name", input.name),
    line("Types", input.types.join(" / ")),
    `Base stats: ${stats}`,
    `Abilities:\n  ${abilities}`,
    line("Category", input.category),
    line("Height", input.height),
    line("Weight", input.weight),
    line("Habitat", input.habitat),
    line("Inspired by", input.inspiration),
    line("Design notes", input.designNotes),
    line("Art style", input.artStyle),
    line("Color palette", input.palette.join(", ")),
  ].join("\n");
}

/** Lets the app run end to end without an API key. */
function mockText(input: FakemonInput): GeneratedText {
  const [primary] = input.types;
  return {
    category: input.category || `${primary} Spirit`,
    height: input.height || "1.0 m",
    weight: input.weight || "20.0 kg",
    habitat: input.habitat || "Unknown",
    flavorText: `${input.name} is rarely seen by trainers. (Placeholder text: add ANTHROPIC_API_KEY to generate real entries.)`,
    abilities: input.abilities.length
      ? input.abilities
      : [{ name: "Mystery", description: "Its power is not yet understood.", hidden: false }],
    signatureMove: { name: `${primary} Burst`, type: primary, description: "A placeholder signature move." },
    imagePrompt: `An original ${input.types.join("/")} type creature named ${input.name}. ${input.designNotes} Style: ${input.artStyle}.`,
  };
}
