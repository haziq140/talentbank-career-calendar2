"use client";

import { useState } from "react";

const TYPES = ["public", "university", "sector"];
const SECTORS = ["general", "tech", "engineering"];
const STATUSES = ["draft", "published", "full", "cancelled"];

const empty = {
  title: "",
  type: "public",
  sector: "general",
  startDate: "",
  endDate: "",
  location: "",
  capacity: "",
  status: "draft",
  registrationLink: "",
};

export default function EventForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial ? { ...empty, ...initial } : empty);
  const [saving, setSaving] = useState(false);
  const [clashes, setClashes] = useState([]);
  const [error, setError] = useState("");

  const isEdit = Boolean(initial?.id);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        endDate: form.endDate || form.startDate,
        capacity: form.capacity === "" ? null : Number(form.capacity),
        editedBy: "events-team",
      };

      const res = await fetch(isEdit ? `/api/events/${initial.id}` : "/api/events", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setClashes(data.clashes || []);
      onSaved?.(data.event);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-line rounded-lg p-5 bg-white space-y-3">
      <h3 className="font-display font-semibold text-lg">
        {isEdit ? "Edit event" : "Add new event"}
      </h3>

      <input
        required
        placeholder="Event title"
        className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-ink/50 font-mono uppercase">
          Start date
          <input
            required
            type="date"
            className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </label>
        <label className="text-xs text-ink/50 font-mono uppercase">
          End date (optional)
          <input
            type="date"
            className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </label>
      </div>

      <input
        required
        placeholder="Location"
        className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        value={form.location}
        onChange={(e) => set("location", e.target.value)}
      />

      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs text-ink/50 font-mono uppercase">
          Type
          <select
            className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm capitalize"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink/50 font-mono uppercase">
          Sector
          <select
            className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm capitalize"
            value={form.sector}
            onChange={(e) => set("sector", e.target.value)}
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink/50 font-mono uppercase">
          Status
          <select
            className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm capitalize"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-xs text-ink/50 font-mono uppercase block">
        Capacity (leave blank for unlimited)
        <input
          type="number"
          min="0"
          className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm"
          value={form.capacity}
          onChange={(e) => set("capacity", e.target.value)}
        />
      </label>

      <input
        placeholder="Registration link"
        className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        value={form.registrationLink}
        onChange={(e) => set("registrationLink", e.target.value)}
      />

      {clashes.length > 0 && (
        <div className="text-sm border border-amber/40 bg-amber/10 text-ink rounded-lg p-3">
          <p className="font-medium">
            Heads up — {clashes.length} other event{clashes.length > 1 ? "s" : ""} overlap these
            dates:
          </p>
          <ul className="mt-1 list-disc list-inside text-ink/70">
            {clashes.map((c) => (
              <li key={c.id}>
                {c.title} ({c.startDate}
                {c.endDate !== c.startDate ? ` – ${c.endDate}` : ""})
              </li>
            ))}
          </ul>
          <p className="mt-1 text-ink/50 text-xs">
            This is just a warning — fairs can legitimately run same-day in different cities.
            Saved anyway.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-clash">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-paper rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add event"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-line rounded-lg px-4 py-2 text-sm text-ink/60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
