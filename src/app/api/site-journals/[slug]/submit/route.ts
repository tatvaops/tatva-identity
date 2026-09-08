import { NextResponse } from "next/server";
import { submitSiteJournalAction } from "@/lib/actions/site-journals";
import { getSiteJournalBySlug } from "@/lib/data/site-journals";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await submitSiteJournalAction(slug);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const journal = await getSiteJournalBySlug(slug, true);
  return NextResponse.json({ journal: journal.data });
}
