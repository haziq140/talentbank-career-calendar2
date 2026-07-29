import { NextResponse } from "next/server";
import { registerForEvent, getEvent } from "@/lib/store";
import { sendRegistrationEmail } from "@/lib/email";

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
    const event = await getEvent(id);

    // Fire the confirmation email but don't let a failed send block the
    // registration itself — the person already has their spot either way.
    if (event) {
      sendRegistrationEmail({
        toEmail: body.email,
        toName: body.name,
        event,
        waitlisted: Boolean(body.waitlist),
      }).catch((err) => console.error("Email send error:", err));
    }

    return NextResponse.json({ registration });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
