import { NextResponse } from "next/server";
import { submitSiteJournalAction } from "@/lib/actions/site-journals";
import { getSiteJournalBySlug } from "@/lib/data/site-journals";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await submitSiteJournalAction(slug);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const journal = await getSiteJournalBySlug(slug, true);
  if (journal.meta.error) return NextResponse.json({ error: journal.meta.error }, { status: 503 });
  if (!journal.data) return NextResponse.json({ error: "Journal could not be loaded after submission." }, { status: 500 });
  return NextResponse.json({ journal: journal.data });
}
