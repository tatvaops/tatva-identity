import Link from "next/link";
import { seedDataEnabled } from "@/lib/data/network";

export async function DemoDataBanner() {
  const enabled = await seedDataEnabled();
  if (!enabled) return null;
  return (
    <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      Demonstration profiles are visible and labelled as demo. Operators can hide them in{" "}
      <Link href="/admin/settings" className="font-medium underline underline-offset-2">
        Admin → Settings
      </Link>
      .
    </p>
  );
}
