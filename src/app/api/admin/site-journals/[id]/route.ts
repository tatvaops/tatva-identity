import { NextResponse } from "next/server";
import { adminPatchSiteJournal } from "@/lib/admin/site-journal-actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = await adminPatchSiteJournal(id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id });
}
