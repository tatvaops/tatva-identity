import { NextResponse } from "next/server";
import { deleteFieldNoteAction } from "@/lib/actions/site-journals";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; entryId: string; commentId: string }> },
) {
  const { slug, entryId, commentId } = await params;
  const result = await deleteFieldNoteAction(slug, entryId, commentId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
