import { FeedView } from "@/features/feed/feed-view";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string }>;
}) {
  const { compose } = await searchParams;
  return <FeedView compose={compose === "1"} />;
}
