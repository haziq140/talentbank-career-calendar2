import { NextResponse } from "next/server";
import { getRegistrationsByEmail } from "@/lib/store";

// GET /api/registrations?email=someone@example.com
// Returns the event IDs this email has registered for, so the client
// can mark those events as "Registered" without relying on localStorage.
export async function GET(request) {
  const email = new URL(request.url).searchParams.get("email");
  if (!email) return NextResponse.json({ eventIds: [] });

  const registrations = await getRegistrationsByEmail(email);
  const eventIds = registrations.map((r) => r.eventId);
  return NextResponse.json({ eventIds });
}
