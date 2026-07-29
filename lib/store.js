// lib/store.js
//
// Firestore-backed store. Same function names/shapes as before
// (getEvents / createEvent / updateEvent / etc.) so nothing in app/
// or components/ needs to change beyond awaiting these calls, since
// Firestore reads/writes are asynchronous.

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

function stripUndefined(obj) {
  // Firestore rejects `undefined` field values (unlike JSON, which just
  // drops them). This round-trip removes them safely.
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

// ---------- Events ----------

export async function getEvents() {
  const snap = await getDocs(collection(db, "events"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getEvent(id) {
  const snap = await getDoc(doc(db, "events", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createEvent(input) {
  const eventData = {
    title: input.title,
    type: input.type, // public | university | sector
    sector: input.sector || "general",
    startDate: input.startDate,
    endDate: input.endDate || input.startDate,
    location: input.location,
    capacity: input.capacity ?? null, // null = unlimited
    registeredCount: 0,
    status: input.status || "draft", // draft | published | full | cancelled
    registrationLink: input.registrationLink || "",
    lastEditedBy: input.editedBy || "unknown",
    lastEditedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, "events"), eventData);
  const event = { id: docRef.id, ...eventData };

  await logAudit(event.id, "created", null, event, input.editedBy);
  return event;
}

export async function updateEvent(id, patch, editedBy = "unknown") {
  const ref = doc(db, "events", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Event not found");

  const before = { id, ...snap.data() };
  const after = {
    ...before,
    ...patch,
    lastEditedBy: editedBy,
    lastEditedAt: new Date().toISOString(),
  };

  // Auto fill-up logic: if capacity is set and registeredCount reaches it,
  // flip to "full" automatically. If it drops back below (e.g. capacity
  // raised), and it wasn't cancelled, flip back to "published".
  if (after.capacity != null) {
    if (after.registeredCount >= after.capacity && after.status !== "cancelled") {
      after.status = "full";
    } else if (
      after.registeredCount < after.capacity &&
      after.status === "full"
    ) {
      after.status = "published";
    }
  }

  const { id: _drop, ...afterData } = after;
  await updateDoc(ref, afterData);

  const action =
    after.status === "cancelled" && before.status !== "cancelled"
      ? "cancelled"
      : before.startDate !== after.startDate || before.endDate !== after.endDate
      ? "moved"
      : before.capacity !== after.capacity
      ? "capacity_changed"
      : before.registeredCount !== after.registeredCount
      ? "registration"
      : "edited";

  await logAudit(id, action, before, after, editedBy);
  return after;
}

export async function cancelEvent(id, editedBy = "unknown") {
  return updateEvent(id, { status: "cancelled" }, editedBy);
}

// Returns events whose [startDate, endDate] range overlaps the given
// range, excluding the event being edited (if any). Filtering happens
// in JS rather than as a compound Firestore range query on purpose —
// Firestore can't do inequality filters on two different fields in one
// query, so a naive "startDate <= end AND endDate >= start" query would
// silently miss overlaps. Fetch the (small) event set and filter here.
export async function findClashes({ startDate, endDate, excludeId }) {
  const events = await getEvents();
  return events.filter((e) => {
    if (e.id === excludeId) return false;
    if (e.status === "cancelled") return false;
    return e.startDate <= endDate && e.endDate >= startDate;
  });
}

// ---------- Registrations ----------

export async function getRegistrations(eventId) {
  const q = query(collection(db, "registrations"), where("eventId", "==", eventId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function registerForEvent(eventId, { name, email, role }) {
  const event = await getEvent(eventId);
  if (!event) throw new Error("Event not found");
  if (event.status === "cancelled") throw new Error("This event is cancelled");
  if (event.status === "full") throw new Error("This event is full");

  const regData = {
    eventId,
    name,
    email,
    role: role || "candidate",
    registeredAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, "registrations"), regData);
  const reg = { id: docRef.id, ...regData };

  await updateEvent(eventId, { registeredCount: event.registeredCount + 1 }, "public-registration");
  return reg;
}

// ---------- Audit log ----------

async function logAudit(eventId, action, before, after, editedBy = "unknown") {
  const entry = {
    eventId,
    action,
    before: stripUndefined(before),
    after: stripUndefined(after),
    editedBy: editedBy || "unknown",
    timestamp: new Date().toISOString(),
  };
  await addDoc(collection(db, "auditLog"), entry);
}

export async function getAuditLog(eventId) {
  const col = collection(db, "auditLog");
  const snap = await getDocs(eventId ? query(col, where("eventId", "==", eventId)) : col);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
