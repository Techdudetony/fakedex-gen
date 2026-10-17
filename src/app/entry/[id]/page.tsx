import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DexEntryCard } from "@/components/dex-entry-card";
import { getStore } from "@/lib/store";

export default function EntryPage(props: PageProps<"/entry/[id]">) {
  return (
    <Suspense fallback={<p className="text-dex-muted">Loading entry…</p>}>
      <Entry params={props.params} />
    </Suspense>
  );
}

async function Entry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getStore().get(id);
  if (!entry) notFound();
  return <DexEntryCard entry={entry} />;
}
