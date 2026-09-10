import { NextResponse } from "next/server";
import { listSiteJournals, getSiteJournalBySlug } from "@/lib/data/site-journals";
import { createSiteJournalAction } from "@/lib/actions/site-journals";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listed = await listSiteJournals({
    q: searchParams.get("q") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    projectType: searchParams.get("projectType") ?? undefined,
    risk: (searchParams.get("risk") as "stable" | "watch" | "risk" | "all" | null) ?? undefined,
    includeUnpublished: searchParams.get("includeUnpublished") === "true",
    ownerId: searchParams.get("ownerId") ?? undefined,
  });
  if (listed.meta.error) return NextResponse.json({ error: listed.meta.error }, { status: 503 });
  return NextResponse.json({ journals: listed.data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await createSiteJournalAction(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  if (!result.id) return NextResponse.json({ error: "Journal was created without an identifier." }, { status: 500 });
  const journal = await getSiteJournalBySlug(result.id ?? "", true);
  if (journal.meta.error) return NextResponse.json({ error: journal.meta.error }, { status: 503 });
  if (!journal.data) return NextResponse.json({ error: "Journal could not be loaded after creation." }, { status: 500 });
  return NextResponse.json({ journal: journal.data }, { status: 201 });
}
