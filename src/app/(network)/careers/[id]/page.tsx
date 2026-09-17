import { redirect } from "next/navigation";

export default async function CareerJobLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/jobs/${encodeURIComponent(id)}`);
}
