//users Page for the Talentbank Career Fair Calendar. This is a client-side rendered component that fetches and displays events, allows filtering by sector, and shows event details in a modal.
"use client";

import { useEffect, useMemo, useState } from "react";
import WeekStrip from "@/components/WeekStrip";
import EventModal from "@/components/EventModal";
import StatusBadge from "@/components/StatusBadge";

const SECTORS = ["all", "general", "tech", "engineering"];
const TYPES = ["all", "public", "university", "sector"];
const TYPE_LABELS = { public: "Public", university: "University", sector: "Sector" };
const DATE_RANGES = [
  { value: "all", label: "All upcoming" },
  { value: "30", label: "Next 30 days" },
  { value: "month", label: "This month" },
  { value: "90", label: "Next 3 months" },
];

function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { day: "numeric", month: "short" };
  if (start === end) return s.toLocaleDateString("en-GB", opts);
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function daysToGo(startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (today >= start && today <= end) return "Happening now";
  const diff = Math.round((start - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `${diff} days to go`;
  return null;
}

function withinDateRange(event, range) {
  if (range === "all") return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(event.startDate);

  if (range === "month") {
    return start.getFullYear() === today.getFullYear() && start.getMonth() === today.getMonth();
  }
  const days = Number(range);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  return start <= cutoff;
}

const EMAIL_STORAGE_KEY = "tb-user-email";

function loadSavedEmail() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(EMAIL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export default function UserPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState("all");
  const [type, setType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [email, setEmail] = useState("");
  const [registeredIds, setRegisteredIds] = useState(() => new Set());

  // We have no login system, so "which events has this visitor registered
  // for" is keyed off the email they last typed into the registration
  // form (remembered locally). The actual registration status is always
  // looked up fresh from Firestore via /api/registrations — the local
  // value is just an identifier, not a source of truth.
  async function refreshRegisteredIds(forEmail) {
    if (!forEmail) {
      setRegisteredIds(new Set());
      return;
    }
    try {
      const res = await fetch(`/api/registrations?email=${encodeURIComponent(forEmail)}`);
      const data = await res.json();
      setRegisteredIds(new Set(data.eventIds || []));
    } catch (err) {
      console.error("Failed to load registration status:", err);
    }
  }

  useEffect(() => {
    const savedEmail = loadSavedEmail();
    setEmail(savedEmail);
    refreshRegisteredIds(savedEmail);
  }, []);

  function handleRegistered(eventId, registeredEmail) {
    setEmail(registeredEmail);
    try {
      window.localStorage.setItem(EMAIL_STORAGE_KEY, registeredEmail);
    } catch {
      // localStorage unavailable (private browsing, etc.) — status still works for this session
    }
    load();
    refreshRegisteredIds(registeredEmail);
  }

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
      .filter((e) => sector === "all" || e.sector === sector)
      .filter((e) => type === "all" || e.type === type)
      .filter((e) => withinDateRange(e, dateRange));
  }, [events, sector, type, dateRange]);

  const publishedTotal = events.filter((e) => e.status !== "draft").length;

  return (
    <div className="max-w-4xl mx-auto w-full px-5 py-10 flex-1">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber" />
          Talentbank · Career Fairs
        </p>
        <h1 className="font-display font-semibold text-4xl">This week, and every week</h1>
        <div className="h-0.5 w-14 bg-amber mt-3 mb-3" />
        <p className="text-ink/60">
          A running calendar of every Talentbank fair — plan around it, register in advance, and
          see the moment something changes.
        </p>
      </header>

      <WeekStrip events={events} onSelect={setSelected} weekOffset={weekOffset} onWeekChange={setWeekOffset} />

      <div className="flex flex-col gap-2.5 mt-10 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1.5 flex-wrap">
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

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded-full text-xs border capitalize transition-colors ${
                  type === t
                    ? "bg-teal text-paper border-teal"
                    : "border-line text-ink/50 hover:border-ink/40"
                }`}
              >
                {t === "all" ? "Any type" : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="ml-auto text-xs border border-line rounded-full px-3 py-1 bg-white text-ink/60"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-ink/40 text-sm">Loading events…</p>
      ) : visible.length === 0 ? (
        <p className="text-ink/40 text-sm border border-line rounded-lg p-6 text-center">
          No upcoming events match this filter yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => {
            const countdown = daysToGo(e.startDate, e.endDate);
            const isRegistered = registeredIds.has(e.id);
            return (
              <li key={e.id}>
                <button
                  onClick={() => setSelected(e)}
                  className="w-full text-left flex items-center gap-4 border border-line border-l-[3px] border-l-teal rounded-lg px-4 py-3 bg-white hover:border-ink/30 hover:border-l-teal transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.title}</p>
                    <p className="text-ink/50 text-sm">
                      {formatRange(e.startDate, e.endDate)} · {e.location}
                    </p>
                  </div>
                  {isRegistered ? (
                    <span className="font-mono text-[0.65rem] uppercase tracking-wide text-teal bg-teal/10 border border-teal/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                      Registered
                    </span>
                  ) : countdown ? (
                    <span className="font-mono text-[0.65rem] uppercase tracking-wide text-ink/40 whitespace-nowrap hidden sm:block">
                      {countdown}
                    </span>
                  ) : null}
                  <StatusBadge status={e.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="mt-10 pt-5 border-t border-line text-xs text-ink/40 flex justify-between">
        <span>Talentbank Career Fair Calendar — prototype</span>
        <a href="/admin" className="hover:text-ink/70 underline">
          Events team login
        </a>
      </footer>

      <EventModal
        key={selected?.id}
        event={selected}
        alreadyRegistered={selected ? registeredIds.has(selected.id) : false}
        defaultEmail={email}
        onClose={() => setSelected(null)}
        onRegistered={handleRegistered}
      />
    </div>
  );
}