import { readLocalImage } from "@/lib/store";

/** Serves images saved by the local (no Supabase) store. */
export async function GET(_req: Request, ctx: RouteContext<"/api/local-images/[file]">) {
  const { file } = await ctx.params;
  const image = await readLocalImage(file);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      // Placeholder images are SVG; never let one run script.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
