import { CreateFakemon } from "@/components/create-fakemon";

export default function CreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">New fakemon</h1>
        <p className="text-dex-muted">
          Fill in as much or as little as you like. Anything you leave blank, the dex fills in for you.
        </p>
      </div>
      <CreateFakemon />
    </div>
  );
}
