"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";

function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { day: "numeric", month: "short", year: "numeric" };
  if (start === end) return s.toLocaleDateString("en-GB", opts);
  return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString(
    "en-GB",
    opts
  )}`;
}

export default function EventModal({ event, onClose, onRegistered }) {
  const [form, setForm] = useState({ name: "", email: "", role: "candidate" });
  const [state, setState] = useState("idle"); // idle | submitting | done | error
  const [error, setError] = useState("");
  const [waitlist, setWaitlist] = useState(false);

  if (!event) return null;

  const isCancelled = event.status === "cancelled";
  const isFull = event.status === "full";
  const spotsLeft =
    event.capacity != null ? Math.max(event.capacity - event.registeredCount, 0) : null;

  async function submit(e) {
    e.preventDefault();
    setState("submitting");
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, waitlist }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setState("done");
      onRegistered?.();
    } catch (err) {
      setState("error");
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-paper rounded-xl max-w-md w-full p-6 border border-line shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-display font-semibold text-2xl leading-tight">{event.title}</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <StatusBadge status={event.status} />

        <dl className="mt-4 space-y-1.5 font-mono text-sm text-ink/70">
          <div className="flex justify-between">
            <dt>Dates</dt>
            <dd>{formatRange(event.startDate, event.endDate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Location</dt>
            <dd>{event.location}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Spots</dt>
            <dd>{spotsLeft != null ? `${spotsLeft} left` : "Open"}</dd>
          </div>
        </dl>

        {isCancelled && (
          <p className="mt-5 text-sm text-clash border border-clash/30 bg-clash/5 rounded-lg p-3">
            This event has been cancelled by the organiser. Check back for future fairs in this
            sector.
          </p>
        )}

        {!isCancelled && state === "done" && (
          <p className="mt-5 text-sm text-teal border border-teal/30 bg-teal/5 rounded-lg p-3">
            {waitlist
              ? "You’re on the waitlist — we’ll email you if a spot opens up."
              : "You’re registered. Check your email for confirmation."}
          </p>
        )}

        {!isCancelled && state !== "done" && (
          <form onSubmit={submit} className="mt-5 space-y-2.5">
            {isFull && (
              <label className="flex items-center gap-2 text-sm text-amber font-medium">
                <input
                  type="checkbox"
                  checked={waitlist}
                  onChange={(e) => setWaitlist(e.target.checked)}
                />
                This event is full — join the waitlist instead
              </label>
            )}
            <input
              required
              placeholder="Full name"
              className="w-full border border-line rounded-lg px-3 py-2 bg-white text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email"
              className="w-full border border-line rounded-lg px-3 py-2 bg-white text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <select
              className="w-full border border-line rounded-lg px-3 py-2 bg-white text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="candidate">I'm a candidate</option>
              <option value="employer">I'm an employer</option>
            </select>
            {error && <p className="text-sm text-clash">{error}</p>}
            <button
              type="submit"
              disabled={state === "submitting" || (isFull && !waitlist)}
              className="w-full bg-ink text-paper rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
            >
              {isFull && !waitlist
                ? "Full — check the waitlist box above"
                : state === "submitting"
                ? "Submitting…"
                : waitlist
                ? "Join waitlist"
                : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
