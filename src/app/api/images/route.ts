import { NextResponse } from "next/server";
import { z } from "zod";
import { generateImages } from "@/lib/image-gen";
import { ReferenceImageSchema } from "@/lib/types";

const BodySchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  references: z.array(ReferenceImageSchema).max(3),
  count: z.number().int().min(1).max(4).default(4),
});

/** Generates candidate images from an image prompt. */
export async function POST(req: Request) {
  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: z.prettifyError(body.error) }, { status: 400 });
  }
  try {
    const images = await generateImages(body.data.prompt, body.data.references, body.data.count);
    return NextResponse.json({ images });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
