import { FeedView } from "@/features/feed/feed-view";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string; page?: string }>;
}) {
  const { compose, page } = await searchParams;
  const parsed = Number.parseInt(page ?? "1", 10);
  return <FeedView compose={compose === "1"} page={Number.isFinite(parsed) ? parsed : 1} />;
}
