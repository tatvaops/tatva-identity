import { NextResponse } from "next/server";
import { listFieldNotes } from "@/lib/data/site-journals";
import { addFieldNoteAction } from "@/lib/actions/site-journals";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; entryId: string }> }) {
  const { entryId } = await params;
  const notes = await listFieldNotes(entryId);
  if (notes.meta.error) return NextResponse.json({ error: notes.meta.error }, { status: 503 });
  return NextResponse.json({ notes: notes.data });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string; entryId: string }> }) {
  const { slug, entryId } = await params;
  const body = await request.json().catch(() => null);
  const result = await addFieldNoteAction(slug, entryId, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const notes = await listFieldNotes(entryId);
  return NextResponse.json({ notes: notes.data }, { status: 201 });
}
