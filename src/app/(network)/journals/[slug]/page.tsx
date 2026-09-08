import { notFound, redirect } from "next/navigation";

export default async function JournalSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();
  redirect(`/projects/${slug}`);
}
