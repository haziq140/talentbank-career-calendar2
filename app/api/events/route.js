import { NextResponse } from "next/server";
import { getEvents, createEvent, findClashes } from "@/lib/store";

export async function GET() {
  const events = (await getEvents()).sort((a, b) => a.startDate.localeCompare(b.startDate));
  return NextResponse.json({ events });
}

export async function POST(request) {
  const body = await request.json();

  if (!body.title || !body.startDate || !body.location) {
    return NextResponse.json(
      { error: "title, startDate and location are required" },
      { status: 400 }
    );
  }

  const clashes = await findClashes({
    startDate: body.startDate,
    endDate: body.endDate || body.startDate,
  });

  const event = await createEvent(body);

  return NextResponse.json({ event, clashes });
}
