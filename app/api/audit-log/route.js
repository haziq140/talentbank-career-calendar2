import { NextResponse } from "next/server";
import { getAuditLog } from "@/lib/store";

export async function GET(request) {
  const eventId = new URL(request.url).searchParams.get("eventId") || undefined;
  const log = (await getAuditLog(eventId)).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return NextResponse.json({ log });
}
