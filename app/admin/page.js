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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5 font-sans">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
            <span className="text-white text-xl">🔒</span>
          </div>
          <h1 className="font-extrabold text-2xl text-slate-900">Events Dashboard</h1>
          <p className="text-slate-500 mt-2">Sign in to manage the calendar.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Admin Password</label>
          <input
            type="password"
            autoFocus
            placeholder="Enter password"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {errorMessage && (
            <p className="text-sm font-medium text-rose-500 bg-rose-50 p-3 rounded-lg mb-4">{errorMessage}</p>
          )}
          
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold transition-all shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5">
            Access Dashboard
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-xs font-mono bg-slate-50 inline-block px-3 py-1.5 rounded-lg border border-slate-100">
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
    { label: "Total Events", value: events.length, color: "text-slate-900", bg: "bg-white" },
    { label: "Published", value: statusCounts.published || 0, color: "text-indigo-600", bg: "bg-indigo-50/50" },
    { label: "Full Capacity", value: statusCounts.full || 0, color: "text-emerald-600", bg: "bg-emerald-50/50" },
    { label: "Drafts", value: statusCounts.draft || 0, color: "text-amber-600", bg: "bg-amber-50/50" },
    { label: "Cancelled", value: statusCounts.cancelled || 0, color: "text-rose-600", bg: "bg-rose-50/50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className={`border border-slate-200 rounded-2xl p-5 ${card.bg} shadow-sm transition-transform hover:-translate-y-1 duration-200`}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{card.label}</p>
          <p className={`font-extrabold text-3xl ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function AuditLogPanel({ log }) {
  if (!log || log.length === 0) return null;
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-8 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
        Recent Activity
      </h3>
      <ul className="space-y-3">
        {log.slice(0, 8).map((entry) => (
          <li key={entry.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="font-medium text-slate-700">
              <span className="text-indigo-600 font-bold mr-2">{entry.action}</span>
              {entry.after?.title || entry.before?.title}
            </span>
            <span className="text-slate-400 mt-1 sm:mt-0 text-xs font-medium bg-white px-2 py-1 rounded shadow-sm">
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
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto w-full px-5 py-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">TB</div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Events Team</p>
            </div>
            <h1 className="font-extrabold text-2xl text-slate-900 mt-2">Manage Calendar</h1>
          </div>
          <a href="/" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm text-center">
            View Public Site
          </a>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            <SummaryStrip events={events} />

            <div className="flex items-center justify-between mb-4 mt-12">
              <h2 className="font-extrabold text-xl text-slate-900">All Events</h2>
              <button 
                onClick={() => setEditingContext("new")} 
                className="bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span> Add Event
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8">
              <AdminCalendar
                events={events}
                onDateClick={(isoString) => setEditingContext({ startDate: isoString, endDate: isoString })}
                onEventClick={(event) => setEditingContext(event)}
              />
            </div>

            {/* Event Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Event Details</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Capacity</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events
                      .sort((a, b) => a.startDate.localeCompare(b.startDate))
                      .map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{event.title}</p>
                            <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                              📍 {event.location}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                            {event.startDate}
                            {event.endDate !== event.startDate && (
                              <span className="text-slate-400"> → {event.endDate}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            <span className="bg-slate-100 px-2 py-1 rounded">
                              {event.registeredCount} / {event.capacity != null ? event.capacity : "∞"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={event.status} />
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {/* Buttons are now always visible */}
                            <button
                              onClick={() => setEditingContext(event)}
                              className="text-indigo-600 font-semibold hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg mr-2 transition-colors"
                            >
                              Edit
                            </button>
                            {event.status !== "cancelled" && (
                              <button
                                onClick={() => handleCancelEvent(event.id)}
                                className="text-rose-600 font-semibold hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
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
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto"
                onClick={() => setEditingContext(null)}
              >
                <div 
                  className="w-full max-w-xl my-8 sm:my-0 bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
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