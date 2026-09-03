import { NetworkView } from "@/features/network/network-view";

export default function FollowersPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Followers</h1>
      <NetworkView focus="followers" />
    </div>
  );
}
