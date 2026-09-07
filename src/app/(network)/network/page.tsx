import { NetworkView } from "@/features/network/network-view";

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">My network</h1>
      <NetworkView focus={tab} />
    </div>
  );
}
