//users Page for the Talentbank Career Fair Calendar. This is a client-side rendered component that fetches and displays events, allows filtering by sector, and shows event details in a modal.
"use client";

import { useEffect, useMemo, useState } from "react";
import WeekStrip from "@/components/WeekStrip";
import EventModal from "@/components/EventModal";
import StatusBadge from "@/components/StatusBadge";

const SECTORS = ["all", "general", "tech", "engineering"];

function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { day: "numeric", month: "short" };
  if (start === end) return s.toLocaleDateString("en-GB", opts);
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

export default function UserPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState("all");
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data.events || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.status !== "draft")
      .filter((e) => e.endDate >= today)
      .filter((e) => sector === "all" || e.sector === sector);
  }, [events, sector]);

  const publishedTotal = events.filter((e) => e.status !== "draft").length;

  return (
    <div className="max-w-4xl mx-auto w-full px-5 py-10 flex-1">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
          Talentbank · Career Fairs
        </p>
        <h1 className="font-display font-semibold text-4xl">This week, and every week</h1>
        <p className="text-ink/60 mt-2">
          A running calendar of every Talentbank fair — plan around it, register in advance, and
          see the moment something changes.
        </p>
      </header>

      <WeekStrip events={events} onSelect={setSelected} />

      <div className="flex items-center justify-between mt-10 mb-4 flex-wrap gap-3">
        <div className="flex gap-1.5">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`px-3 py-1.5 rounded-full text-sm border capitalize transition-colors ${
                sector === s
                  ? "bg-ink text-paper border-ink"
                  : "border-line text-ink/60 hover:border-ink/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="font-mono text-xs text-ink/50">
          Showing {visible.length} of {publishedTotal} events
        </p>
      </div>

      {loading ? (
        <p className="text-ink/40 text-sm">Loading events…</p>
      ) : visible.length === 0 ? (
        <p className="text-ink/40 text-sm border border-line rounded-lg p-6 text-center">
          No upcoming events match this filter yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => setSelected(e)}
                className="w-full text-left flex items-center justify-between gap-4 border border-line rounded-lg px-4 py-3 bg-white hover:border-ink/30 transition-colors"
              >
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-ink/50 text-sm">
                    {formatRange(e.startDate, e.endDate)} · {e.location}
                  </p>
                </div>
                <StatusBadge status={e.status} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-10 pt-5 border-t border-line text-xs text-ink/40 flex justify-between">
        <span>Talentbank Career Fair Calendar — prototype</span>
        <a href="/admin" className="hover:text-ink/70 underline">
          Events team login
        </a>
      </footer>

      <EventModal event={selected} onClose={() => setSelected(null)} onRegistered={load} />
    </div>
  );
}
