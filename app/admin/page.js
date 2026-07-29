"use client";

import { useEffect, useMemo, useState } from "react";
import EventForm from "@/components/EventForm";
import StatusBadge from "@/components/StatusBadge";
import AdminCalendar from "@/components/AdminCalendar";

// NOTE: this is a stand-in login for the prototype demo, not real auth.
// In production this becomes Firebase Auth (email/password), gating this
// route via middleware instead of a client-side sessionStorage check.
const DEMO_PASSWORD = "talentbank2026";

function LoginGate({ onSuccess }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (value === DEMO_PASSWORD) {
      sessionStorage.setItem("tb-admin", "1");
      onSuccess();
    } else {
      setError("Incorrect password");
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-5">
      <form onSubmit={submit} className="max-w-xs w-full border border-line rounded-lg p-6 bg-white">
        <h1 className="font-display font-semibold text-xl mb-1">Events team login</h1>
        <p className="text-ink/50 text-sm mb-4">Admin login — password below for the demo.</p>
        <input
          type="password"
          autoFocus
          placeholder="Password"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm mb-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error && <p className="text-sm text-clash mb-2">{error}</p>}
        <button className="w-full bg-ink text-paper rounded-lg py-2 text-sm font-medium">
          Log in
        </button>
        <p className="text-ink/30 text-xs mt-3 font-mono">Password: {DEMO_PASSWORD}</p>
      </form>
    </div>
  );
}

function SummaryStrip({ events }) {
  const counts = useMemo(() => {
    const c = { published: 0, full: 0, cancelled: 0, draft: 0 };
    events.forEach((e) => {
      c[e.status] = (c[e.status] || 0) + 1;
    });
    return c;
  }, [events]);

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      <div className="border border-line rounded-lg p-3 bg-white">
        <p className="font-mono text-xs text-ink/50 uppercase">Total events</p>
        <p className="font-display font-semibold text-2xl">{events.length}</p>
      </div>
      {["published", "full", "draft", "cancelled"].map((s) => (
        <div key={s} className="border border-line rounded-lg p-3 bg-white">
          <p className="font-mono text-xs text-ink/50 uppercase">{s}</p>
          <p className="font-display font-semibold text-2xl">{counts[s] || 0}</p>
        </div>
      ))}
    </div>
  );
}

function AuditLogPanel({ log }) {
  if (log.length === 0) return null;
  return (
    <div className="border border-line rounded-lg p-4 bg-white mt-6">
      <h3 className="font-display font-semibold mb-2">Recent activity</h3>
      <ul className="space-y-1.5 text-sm">
        {log.slice(0, 8).map((l) => (
          <li key={l.id} className="flex justify-between text-ink/60 font-mono text-xs">
            <span>
              {l.action} · {l.after?.title || l.before?.title}
            </span>
            <span>
              {l.editedBy} · {new Date(l.timestamp).toLocaleString("en-GB")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [events, setEvents] = useState([]);
  const [log, setLog] = useState([]);
  const [editing, setEditing] = useState(null); // event or "new" or null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthed(sessionStorage.getItem("tb-admin") === "1");
    setChecked(true);
  }, []);

  async function load() {
    setLoading(true);
    const [eventsRes, logRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/audit-log"),
    ]);
    const eventsData = await eventsRes.json();
    const logData = await logRes.json();
    setEvents(eventsData.events || []);
    setLog(logData.log || []);
    setLoading(false);
  }

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  async function cancelEvent(id) {
    if (!confirm("Cancel this event? It stays visible to candidates, marked as cancelled.")) return;
    await fetch(`/api/events/${id}?editedBy=events-team`, { method: "DELETE" });
    load();
  }

  if (!checked) return null;
  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;

  return (
    <div className="max-w-4xl mx-auto w-full px-5 py-10 flex-1">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-1">
            Talentbank · Events team
          </p>
          <h1 className="font-display font-semibold text-3xl">Manage the calendar</h1>
        </div>
        <a href="/" className="text-sm text-ink/50 hover:text-ink underline">
          View public calendar
        </a>
      </header>

      {loading ? (
        <p className="text-ink/40 text-sm">Loading…</p>
      ) : (
        <>
          <SummaryStrip events={events} />

          <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-ink/50">...</p>
          <button onClick={() => setEditing("new")} className="bg-ink text-paper rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap ml-4">
          + Add event
          </button>
          </div>

            <AdminCalendar
              events={events}
              onDateClick={(iso) => setEditing({ startDate: iso, endDate: iso })}
              onEventClick={(e) => setEditing(e)}
            />

          <div className="border border-line rounded-lg overflow-hidden bg-white mt-4">
            <table className="w-full text-sm">
              <thead className="bg-ink/5 text-ink/50 font-mono text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Event</th>
                  <th className="text-left px-4 py-2">Dates</th>
                  <th className="text-left px-4 py-2">Capacity</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {events
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((e) => (
                    <tr key={e.id} className="border-t border-line">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{e.title}</p>
                        <p className="text-ink/40 text-xs">{e.location}</p>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-ink/60">
                        {e.startDate}
                        {e.endDate !== e.startDate ? ` → ${e.endDate}` : ""}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-ink/60">
                        {e.registeredCount}
                        {e.capacity != null ? ` / ${e.capacity}` : " / ∞"}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditing(e)}
                          className="text-xs text-ink/60 hover:text-ink underline mr-3"
                        >
                          Edit
                        </button>
                        {e.status !== "cancelled" && (
                          <button
                            onClick={() => cancelEvent(e.id)}
                            className="text-xs text-clash hover:opacity-70 underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <AuditLogPanel log={log} />
          {editing && (
        <div
        className="fixed inset-0 bg-ink/40 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto"
        onClick={() => setEditing(null)}
        >
        <div className="w-full max-w-lg my-8 sm:my-0" onClick={(e) => e.stopPropagation()}>
        <EventForm
          initial={editing === "new" ? null : editing}
          onSaved={() => {
          setEditing(null);
          load();
          }}
          onCancel={() => setEditing(null)}
          />
          </div>
        </div>
          )}
        </>
      )}
    </div>
  );
}
