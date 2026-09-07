import { NetworkView } from "@/features/network/network-view";
import { PageHeader } from "@/components/ui/section";

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return (
    <div>
      <PageHeader
        eyebrow="Network"
        title="My network"
        body="Connections, requests, followers and people you have worked with."
      />
      <NetworkView focus={tab} />
    </div>
  );
}
