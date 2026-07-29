import { NextResponse } from "next/server";
import { registerForEvent } from "@/lib/store";

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  if (!body.name || !body.email) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 }
    );
  }

  try {
    const registration = await registerForEvent(id, body);
    return NextResponse.json({ registration });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
