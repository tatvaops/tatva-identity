import { redirect } from "next/navigation";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; availability?: string; skill?: string; page?: string }>;
}) {
  const p = await searchParams;
  const next = new URLSearchParams();
  if (p.q) next.set("q", p.q);
  if (p.city) next.set("city", p.city);
  const query = next.toString();
  redirect(query ? `/professionals?${query}` : "/professionals");
}
