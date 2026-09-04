import { seedDataEnabled } from "@/lib/data/network";

export async function DemoDataBanner() {
  const enabled = await seedDataEnabled();
  if (!enabled) return null;
  return (
    <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      Demonstration data is on. These people, companies, jobs and comments are labelled as demo. Hide them with{" "}
      <code className="rounded bg-white px-1">update public.platform_settings set seed_data_enabled = false;</code> or
      delete them with <code className="rounded bg-white px-1">select public.unseed_platform();</code>
    </p>
  );
}
