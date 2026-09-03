import { NetworkView } from "@/features/network/network-view";

export default function ConnectionsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Connections</h1>
      <NetworkView focus="connections" />
    </div>
  );
}
