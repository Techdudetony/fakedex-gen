import "server-only";
import { GoogleGenAI, type Part } from "@google/genai";
import type { ReferenceImage } from "./types";

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image";

export type GeneratedImage = { mimeType: string; data: string };

/**
 * Generates `count` candidate images in parallel. Uses a Gemini image model because it accepts
 * reference images and keeps a character consistent across edits (useful later for evolutions).
 */
export async function generateImages(
  prompt: string,
  references: ReferenceImage[],
  count: number,
): Promise<GeneratedImage[]> {
  if (!process.env.GEMINI_API_KEY) {
    return Array.from({ length: count }, (_, i) => placeholderImage(prompt, i));
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const parts: Part[] = references.map((ref) => ({
    inlineData: { mimeType: ref.mimeType, data: ref.data },
  }));
  parts.push({
    text:
      (references.length ? "Use the attached images as loose design references only. " : "") +
      `Create a single full-body illustration of this original creature, centered on a plain light background, no text or borders: ${prompt}`,
  });

  const results = await Promise.allSettled(
    Array.from({ length: count }, async () => {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts }],
        config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
      });
      const image = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!image?.inlineData?.data) throw new Error("No image returned");
      return { mimeType: image.inlineData.mimeType ?? "image/png", data: image.inlineData.data };
    }),
  );

  const images = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (!images.length) {
    const reason = results.find((r) => r.status === "rejected")?.reason;
    throw new Error(`Image generation failed: ${reason instanceof Error ? reason.message : String(reason)}`);
  }
  return images;
}

/** An SVG stand-in so the app works without a Gemini key. */
function placeholderImage(prompt: string, index: number): GeneratedImage {
  const hue = (hash(prompt) + index * 70) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="hsl(${hue} 60% 92%)"/>
<circle cx="256" cy="270" r="150" fill="hsl(${hue} 55% 55%)"/>
<circle cx="205" cy="240" r="22" fill="#fff"/><circle cx="307" cy="240" r="22" fill="#fff"/>
<circle cx="210" cy="244" r="10" fill="#222"/><circle cx="312" cy="244" r="10" fill="#222"/>
<text x="256" y="480" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#555">Placeholder #${index + 1}: add GEMINI_API_KEY</text>
</svg>`;
  return { mimeType: "image/svg+xml", data: Buffer.from(svg).toString("base64") };
}

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
