import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDexText } from "@/lib/text-gen";
import { FakemonInputSchema, ReferenceImageSchema } from "@/lib/types";

const BodySchema = z.object({
  input: FakemonInputSchema,
  references: z.array(ReferenceImageSchema).max(3),
});

/** Writes the dex text and image prompt for a new fakemon. */
export async function POST(req: Request) {
  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: z.prettifyError(body.error) }, { status: 400 });
  }
  try {
    const text = await generateDexText(body.data.input, body.data.references);
    return NextResponse.json({ text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 502 });
  }
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}
