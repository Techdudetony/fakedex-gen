import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { SaveEntrySchema } from "@/lib/types";

/** Saves a finished entry with its chosen image. */
export async function POST(req: Request) {
  const body = SaveEntrySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: z.prettifyError(body.error) }, { status: 400 });
  }
  try {
    const entry = await getStore().save(body.data);
    return NextResponse.json({ entry });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not save the entry." }, { status: 500 });
  }
}
