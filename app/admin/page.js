// app/admin/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import EventForm from "@/components/EventForm";
import StatusBadge from "@/components/StatusBadge";
import AdminCalendar from "@/components/AdminCalendar";

const DEMO_PASSWORD = "talentbank2026";

// --- Sub-Components ---

function LoginGate({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    if (password === DEMO_PASSWORD) {
      sessionStorage.setItem("tb-admin", "1");
      onSuccess();
    } else {
      setErrorMessage("Incorrect password. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-5 font-sans text-slate-300">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] mb-3">
            <span className="text-white text-lg">🔒</span>
          </div>
          <h1 className="font-extrabold text-xl text-white">Events Dashboard</h1>
          <p className="text-slate-400 mt-1 text-xs">Sign in to manage the calendar.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Password</label>
          <input
            type="password"
            autoFocus
            placeholder="Enter password"
            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {errorMessage && (
            <p className="text-xs font-medium text-rose-400 bg-rose-950/50 border border-rose-900/50 p-2.5 rounded-lg mb-4">{errorMessage}</p>
          )}
          
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)]">
            Access Dashboard
          </button>
          
          <div className="mt-5 text-center">
            <p className="text-slate-500 text-[10px] font-mono bg-slate-900 inline-block px-2 py-1 rounded-md border border-slate-800">
              Demo PW: {DEMO_PASSWORD}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryStrip({ events }) {
  const statusCounts = useMemo(() => {
    const counts = { published: 0, full: 0, cancelled: 0, draft: 0 };
    events.forEach((event) => {
      counts[event.status] = (counts[event.status] || 0) + 1;
    });
    return counts;
  }, [events]);

  const cards = [
    { label: "Total Events", value: events.length, color: "text-white", bg: "bg-[#1e293b]" },
    { label: "Published", value: statusCounts.published || 0, color: "text-blue-400", bg: "bg-blue-900/10" },
    { label: "Full Capacity", value: statusCounts.full || 0, color: "text-emerald-400", bg: "bg-emerald-900/10" },
    { label: "Drafts", value: statusCounts.draft || 0, color: "text-amber-400", bg: "bg-amber-900/10" },
    { label: "Cancelled", value: statusCounts.cancelled || 0, color: "text-rose-400", bg: "bg-rose-900/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {cards.map((card, i) => (
        <div key={i} className={`border border-slate-700 rounded-xl p-4 ${card.bg} shadow-sm transition-transform hover:-translate-y-0.5 duration-200`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
          <p className={`font-extrabold text-xl ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function AuditLogPanel({ log }) {
  if (!log || log.length === 0) return null;
  
  return (
    <div className="bg-[#1e293b]/40 border border-slate-800 rounded-xl p-5 mt-6">
      <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]"></span>
        Recent Activity
      </h3>
      <ul className="space-y-2">
        {log.slice(0, 8).map((entry) => (
          <li key={entry.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
            <span className="font-medium text-slate-300">
              <span className="text-blue-400 font-bold mr-1.5">{entry.action}</span>
              {entry.after?.title || entry.before?.title}
            </span>
            <span className="text-slate-500 mt-1 sm:mt-0 text-[10px] font-medium bg-[#0f172a] px-2.5 py-0.5 rounded-md border border-slate-800">
              {entry.editedBy} · {new Date(entry.timestamp).toLocaleDateString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Main Admin Component ---
export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [events, setEvents] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingContext, setEditingContext] = useState(null); 

  useEffect(() => {
    setIsAuthenticated(sessionStorage.getItem("tb-admin") === "1");
    setIsAuthChecked(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDashboardData();
  }, [isAuthenticated]);

  async function fetchDashboardData() {
    setIsLoading(true);
    try {
      const [eventsRes, logRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/audit-log"),
      ]);
      const eventsData = await eventsRes.json();
      const logData = await logRes.json();
      setEvents(eventsData.events || []);
      setAuditLog(logData.log || []);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelEvent(eventId) {
    const isConfirmed = window.confirm("Cancel this event? It will stay visible to candidates, marked as cancelled.");
    if (!isConfirmed) return;
    
    try {
      await fetch(`/api/events/${eventId}?editedBy=events-team`, { method: "DELETE" });
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to cancel event:", error);
    }
  }

  if (!isAuthChecked) return null;
  if (!isAuthenticated) return <LoginGate onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        
        {/* Header (Dark mode, scaled down) */}
        <nav className="flex flex-wrap items-center justify-between py-3 border-b border-slate-800 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 text-xs font-bold border border-slate-700">
              TB
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold text-white tracking-tight">Events Team</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Manage Calendar</p>
            </div>
          </div>
          
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full p-1">
            <a href="/" className="px-3 py-1 text-slate-500 hover:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors group">
              Public
              <div className="w-7 h-3.5 bg-slate-800 border border-slate-700 rounded-full relative flex items-center px-0.5 justify-end group-hover:border-blue-500 transition-colors">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_3px_rgba(59,130,246,0.5)]"></div>
              </div>
              Admin
            </a>
            <span className="px-3 py-1 rounded-full bg-[#1e293b] text-white text-xs font-semibold shadow-sm border border-slate-700 ml-1">
              Dashboard
            </span>
          </div>
        </nav>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            <SummaryStrip events={events} />

            <div className="flex items-center justify-between mb-3 mt-8">
              <h2 className="font-extrabold text-lg text-white">All Events</h2>
              <button 
                onClick={() => setEditingContext("new")} 
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap shadow-[0_0_10px_rgba(37,99,235,0.3)] hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center gap-1.5"
              >
                <span className="text-sm leading-none">+</span> Add Event
              </button>
            </div>

            <div className="bg-[#1e293b]/40 p-4 rounded-xl border border-slate-800 mb-6">
              <AdminCalendar
                events={events}
                onDateClick={(isoString) => setEditingContext({ startDate: isoString, endDate: isoString })}
                onEventClick={(event) => setEditingContext(event)}
              />
            </div>

            {/* Event Table (Dark mode, smaller text) */}
            <div className="bg-[#1e293b]/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Event Details</th>
                      <th className="px-5 py-3">Dates</th>
                      <th className="px-5 py-3">Capacity</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {events
                      .sort((a, b) => a.startDate.localeCompare(b.startDate))
                      .map((event) => (
                        <tr key={event.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold text-white">{event.title}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                              📍 {event.location}
                            </p>
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-300 whitespace-nowrap">
                            {event.startDate}
                            {event.endDate !== event.startDate && (
                              <span className="text-slate-500"> → {event.endDate}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-300">
                            <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                              {event.registeredCount} / {event.capacity != null ? event.capacity : "∞"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="scale-90 origin-left">
                              <StatusBadge status={event.status} />
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setEditingContext(event)}
                              className="text-blue-400 font-semibold hover:text-blue-300 bg-blue-900/20 border border-blue-800/50 px-2.5 py-1 rounded-md mr-2 transition-colors"
                            >
                              Edit
                            </button>
                            {event.status !== "cancelled" && (
                              <button
                                onClick={() => handleCancelEvent(event.id)}
                                className="text-rose-400 font-semibold hover:text-rose-300 bg-rose-900/20 border border-rose-800/50 px-2.5 py-1 rounded-md transition-colors"
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
            </div>

            <AuditLogPanel log={auditLog} />

            {/* Modal Overlay */}
            {editingContext && (
              <div
                className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto"
                onClick={() => setEditingContext(null)}
              >
                <div 
                  className="w-full max-w-lg my-8 sm:my-0 bg-[#1e293b] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <EventForm
                    initial={editingContext === "new" ? null : editingContext}
                    onSaved={() => {
                      setEditingContext(null);
                      fetchDashboardData();
                    }}
                    onCancel={() => setEditingContext(null)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}