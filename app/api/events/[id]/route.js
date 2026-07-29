import { NextResponse } from "next/server";
import { getEvent, updateEvent, cancelEvent, findClashes } from "@/lib/store";

export async function GET(_request, { params }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const editedBy = body.editedBy || "events-team";

  const existing = await getEvent(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let clashes = [];
  if (body.startDate || body.endDate) {
    clashes = await findClashes({
      startDate: body.startDate || existing.startDate,
      endDate: body.endDate || existing.endDate,
      excludeId: id,
    });
  }

  const event = await updateEvent(id, body, editedBy);
  return NextResponse.json({ event, clashes });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const editedBy = new URL(request.url).searchParams.get("editedBy") || "events-team";
  const event = await cancelEvent(id, editedBy);
  return NextResponse.json({ event });
}
