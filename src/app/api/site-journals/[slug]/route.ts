import { NextResponse } from "next/server";
import { getSiteJournalBySlug } from "@/lib/data/site-journals";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journal = await getSiteJournalBySlug(slug, true);
  if (journal.meta.error) return NextResponse.json({ error: journal.meta.error }, { status: 503 });
  if (!journal.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ journal: journal.data });
}
