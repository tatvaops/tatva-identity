import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { listAdminSiteJournals } from "@/lib/admin/site-journal-actions";

export async function GET(request: Request) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return NextResponse.json({ error: "This console is only for platform operators." }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const journals = await listAdminSiteJournals({
    status: searchParams.get("status") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ journals });
}
