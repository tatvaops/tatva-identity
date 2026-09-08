import { NextResponse } from "next/server";
import { addSiteJournalEntryAction } from "@/lib/actions/site-journals";
import { getSiteJournalBySlug } from "@/lib/data/site-journals";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const result = await addSiteJournalEntryAction(slug, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const journal = await getSiteJournalBySlug(slug, true);
  return NextResponse.json({ journal: journal.data }, { status: 201 });
}
